# Donation Mentoring — Codebase Research

Deep-scan of the codebase as of May 2026. Covers database schema, authentication, routing, email subsystem, mentor display, admin dashboard, and a findings/gotchas section.

---

## 1. Overview

A Next.js (App Router) platform that connects Korean-diaspora mentors with mentees. Mentors are displayed publicly; mentees contact them directly via Calendly, email, or LinkedIn. There is no booking system in-app.

**Key structural fact:** the codebase contains two parallel auth systems — a live custom credential system (`mentors.password`) and a dormant Supabase Auth path (`auth.users → profiles`). Only the custom system is active.

### Repo layout

```
app/
  (protected)/        route group — no enforcement, single redirect page
  admin/              mentors/, emails/, profile/ — CRUD + broadcast
  api/                auth/, email/, webhooks/resend
  components/         MentorCard, MentorModal, FilterSidebar, TopNav, ProfileForm, MentorApplicationModal
  emails/             React Email templates (AnnouncementEmail + Layout + Footer)
  page.tsx            public home — mentor listing
hooks/
  useAuth.ts          session management (sessionStorage)
utils/
  supabase.ts         Supabase anon client
  useMentorFilters.ts filter derivation hook
  helpers.ts          shuffle, getDailyMentor, ensureProtocol, getMentorDisplay
  email.ts            Resend helpers, batch send, token utils
  i18n/               in-memory EN/KO translations (6 modules)
  seo.ts              siteConfig, JSON-LD schemas, AI crawler list
types/
  mentor.ts           Mentor interface
  email.ts            EmailLog, BroadcastRequest, ResendWebhookPayload
supabase/
  migrations/         6 SQL files (schema + RPCs + email system)
  seed.sql            ~14 mentors, app_config, reviews, storage buckets
```

---

## 2. Tech Stack & Tooling

| Layer | Choice |
|---|---|
| Framework | Next.js 16.1.6 — App Router, React 19.2.3 |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL), local via Docker |
| Email | Resend API |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Testing | Jest + jsdom |
| Linting | ESLint (next/core-web-vitals + TypeScript) |
| CI | GitHub Actions |
| Runtime | Node 22+ |

CI workflows (`.github/workflows/`):
- `build-lint-test.yml` — build + lint + test on push/PR to main
- `supabase-migrate.yml` — applies migrations to production Supabase project

---

## 3. Database Layer

### 3.1 Migrations (in order)

| File | What it does |
|---|---|
| `20260106000000_init_schema.sql` | Extensions; `app_config`, `mentors`, `reviews` tables; all RPCs; RLS; grants |
| `20260106000002_secure_mentor_auth.sql` | `login_mentor(email, password) → json` RPC |
| `20260106000003_secure_password_reset.sql` | `reset_mentor_password(token, newPassword) → bool` RPC |
| `20260106000004_allow_nullable_mentor_fields.sql` | Drops NOT NULL on the 6 core bilingual mentor fields |
| `20260106000005_signup_mentor.sql` | `signup_mentor(email, password) → json` RPC + slug generation |
| `20260107000000_email_system.sql` | `email_logs` table; `email_subscribed`/`unsubscribed_at` columns on `mentors`; open/click RPCs |

### 3.2 Tables

#### `mentors` (`init_schema.sql:237-267` + `email_system.sql:5-7`)

Primary table. PK `uuid DEFAULT gen_random_uuid()`. Every credential and profile field lives here.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name_en`, `name_ko` | varchar(255) | originally NOT NULL; made nullable by migration 4 |
| `location_en`, `location_ko` | varchar(255) | same |
| `description_en`, `description_ko` | text | same |
| `position_en`, `position_ko` | text | nullable |
| `company_en`, `company_ko` | text | nullable |
| `picture_url` | text | Supabase storage URL |
| `tags` | jsonb | default `'[]'::jsonb` |
| `languages` | text[] | e.g. `{Korean,English}` |
| `linkedin_url` | text | |
| `calendly_url` | text | literal `'Send to Email'` if no URL |
| `email` | text | login key for `login_mentor` |
| `password` | text | bcrypt via `crypt`+`gen_salt('bf')` |
| `role` | text | default `'mentor'`; CHECK `IN ('admin','mentor')` |
| `display_order` | integer | default 0 |
| `is_active` | boolean | default true; signup sets false |
| `reset_token` | text | indexed |
| `reset_token_expires_at` | timestamptz | |
| `session_time_minutes` | integer | nullable |
| `session_price_usd` | numeric(10,2) | nullable |
| `email_subscribed` | boolean | default true (added migration 6) |
| `unsubscribed_at` | timestamptz | (added migration 6) |
| `slug` | text | referenced in RPC + TS type; **never added by ALTER TABLE in repo** |
| `created_at`, `updated_at` | timestamptz | UTC default now |

Indexes: `idx_mentors_active`, `idx_mentors_created_at DESC`, `idx_mentors_display_order`, `idx_mentors_reset_token`, partial `idx_mentors_email_subscribed WHERE email_subscribed = true`.

#### `app_config` (`init_schema.sql:228-232`)

```sql
CREATE TABLE public.app_config (key text PRIMARY KEY, value text NOT NULL);
```

Holds a single row: `('API_SECRET', 'd4b8e9f0-1c2a-4b3d-8e5f-9a0c1b2d3e4f')`. Used by legacy `update_admin_password` / `update_admin_reset_token` RPCs to gate access. RLS enabled with no policies — only reachable via `SECURITY DEFINER` functions or `service_role`.

#### `reviews` (`init_schema.sql:272-276`)

```sql
CREATE TABLE public.reviews (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  review varchar
);
```

2 seed rows (Korean testimonials). No FK to `mentors`. Public SELECT only.

#### `email_logs` (`email_system.sql:10-44`)

```sql
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('announcement','newsletter','notification','welcome')),
  recipient_filter TEXT NOT NULL CHECK (recipient_filter IN ('all','admins','mentors','custom')),
  recipient_emails TEXT[] NOT NULL,
  recipient_count INTEGER NOT NULL,
  attachment_names TEXT[],
  sent_by UUID REFERENCES public.mentors(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','delivered','bounced')),
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Only FK in the whole database: `sent_by → mentors(id)`. Indexes on `sent_at DESC`, `email_type`, `status`, `sent_by`.

#### `profiles` — referenced, not migrated

`handle_new_user` trigger inserts `(id, email, display_name, avatar_url, role, mentor_id)`. `app/admin/profile/page.tsx:137-140` reads `mentor_id` from it as a legacy lookup. Must exist in the deployed Supabase project; absent from every migration file in the repo.

#### `admins` — referenced, not migrated

Used by `update_admin_password` and `update_admin_reset_token` legacy RPCs. Likely obsolete — equivalent fields now live on `mentors`.

### 3.3 Row-Level Security

| Table | RLS | Policies |
|---|---|---|
| `mentors` | on | SELECT/INSERT/UPDATE/DELETE all `USING (true)` — **fully open** |
| `reviews` | on | SELECT only (`USING (true)`) |
| `app_config` | on | **No policies** — blocked except SECURITY DEFINER / service_role |
| `email_logs` | on | SELECT/INSERT/UPDATE all `USING (true)` — open; no DELETE policy |
| `profiles` | unknown | Not in repo migrations |

Real protection for sensitive `mentors` operations relies on never exposing the service-role key client-side and routing auth through `SECURITY DEFINER` RPCs.

### 3.4 Functions, Triggers, and RPCs

All defined `SECURITY DEFINER`, all granted `EXECUTE` to `anon, authenticated, service_role`.

**Trigger functions** (bound via `CREATE TRIGGER`):
- `handle_new_user()` — fires on `auth.users` INSERT; inserts into `public.profiles`; hard-codes `mulli2@gmail.com` as auto-admin (`init_schema.sql:54-79`). **Not exercised by current custom auth.**
- `update_updated_at_column()` — generic `updated_at` setter; bound to `mentors` and `email_logs`.
- `handle_profiles_updated_at()` — same pattern for `profiles`.
- `validate_role_change_trigger()` — defined but **no `CREATE TRIGGER` binding exists** in any migration. Dead code.

**Client-callable RPCs**:

| RPC | File | Purpose |
|---|---|---|
| `signup_mentor(email, password)` | `20260106000005_signup_mentor.sql` | Create mentor row, hash password, auto-generate slug |
| `login_mentor(email, password)` | `20260106000002_secure_mentor_auth.sql` | Bcrypt verify, return JSON profile |
| `reset_mentor_password(token, newPwd)` | `20260106000003_secure_password_reset.sql` | Verify token expiry, update password, clear token |
| `update_admin_password(id, hash, secret)` | `init_schema.sql` | Legacy; operates on `admins` table |
| `update_admin_reset_token(email, token, expires, secret)` | `init_schema.sql` | Legacy; operates on `admins` table |
| `validate_role_change(target, role, current)` | `init_schema.sql` | Guard: last admin can't demote self |
| `increment_email_opens(resend_id)` | `email_system.sql:71` | Atomic opens++ on email_logs |
| `increment_email_clicks(resend_id)` | `email_system.sql:80` | Atomic clicks++ on email_logs |

**Password pattern:**
- Hash: `crypt(p_password, gen_salt('bf'))` (bcrypt)
- Verify: `stored = crypt(input, stored)` — re-hashes using stored hash as salt; equality → match

### 3.5 Bilingual Convention (`_ko` / `_en`)

Used **only on `mentors`**. Five field pairs: `name`, `location`, `description`, `position`, `company`. Both halves are first-class content (Korean is not a translation of English — they are independently authored). All pairs made nullable by migration 4.

Fallback chain used everywhere in the UI: `preferred_lang_value || other_lang_value || 'No Name'`.

### 3.6 Seed (`supabase/seed.sql`)

Produced via `pg_dump`. Notable contents:

- `auth.audit_log_entries` dump with real login/signup events from actual users (dated 2026-01)
- `app_config`: one row with the `API_SECRET`
- `mentors`: ~14 real mentors with full bilingual profiles, `password = NULL`, `reset_token = NULL`
- `reviews`: 2 Korean testimonials
- `storage.buckets`: `mentor-pictures` (5 MB cap, public), `profile-photos` (no cap, public)
- Post-load `UPDATE`: bootstraps `mulli2@gmail.com` password to `password123` for local dev

No seed data for `profiles`, `admins`, or `email_logs`.

---

## 4. Authentication

### 4.1 Custom Auth (live path)

Credentials live in `mentors.password`. Three `SECURITY DEFINER` RPCs handle the lifecycle:

1. **Signup** — `signup_mentor(email, password)`: inserts mentor row with `is_active=false`, hashed password, `role='mentor'`, empty bilingual fields, auto-generated slug (`split_part(email,'@',1) || '-' || substr(md5(random()::text),1,6)`).
2. **Login** — `login_mentor(email, password)`: verifies via bcrypt, returns JSON mentor profile or NULL.
3. **Reset** — `reset_mentor_password(token, newPassword)`: looks up by token + expiry, updates password, clears token.

Supabase client used is the **anon browser client** (`utils/supabase.ts`) — no service-role key client-side.

### 4.2 Session (`hooks/useAuth.ts`)

Session stored in `sessionStorage` under key `'donation_mentoring_user'` (`useAuth.ts:61-73`). Lost on tab close. No cookies, no HTTP-only token, no server-side session.

**Exposed interface** (`useAuth.ts:40-54`):

```ts
interface UseAuthReturn {
  user: AuthUser | null;   // { id, email, displayName, avatarUrl?, role, mentorId, isActive }
  isLoading, isAuthenticated, isMentor, isAdmin, isApproved
  loginWithEmail, signUpWithEmail, logout
  // Stubs (no-ops / console.warn):
  resetPassword, updatePassword, linkMentorProfile
  needsMentorLink  // hard-coded false
}
```

`isAdmin = user?.role === 'admin'` (`useAuth.ts:189`). Role comes directly from the `login_mentor` RPC response.

### 4.3 Forgot/Reset Password Flow

```
Client POST /api/auth/forgot-password { email, lang }
  → Query mentors by email (if missing → generic 200, anti-enumeration)
  → crypto.randomUUID() token, expiry = now + 1h
  → UPDATE mentors SET reset_token, reset_token_expires_at  (anon key, open RLS)
  → Resend email with link: /reset-password?token=<token>
  → Fallback: console.log link if RESEND_API_KEY missing

Client POST /api/auth/reset-password { token, password }
  → supabase.rpc('reset_mentor_password', { p_token, p_new_password })
  → Redirect to /login after 2s on success
```

### 4.4 Dormant Supabase Auth Path

`handle_new_user` trigger fires on `auth.users` INSERT → inserts `profiles` row with `avatar_url` from `NEW.raw_user_meta_data`. This was designed for Google OAuth + Supabase Auth. The current `signup_mentor` RPC does **not** touch `auth.users`, so this trigger never fires in the live flow. `app/admin/profile/page.tsx:134-145` still queries `profiles.mentor_id` as a legacy fallback.

### 4.5 No Google OAuth

No `signInWithOAuth` call exists anywhere in the codebase. Google references are limited to Google Fonts, an `unoptimized` image flag for `googleusercontent.com` URLs, and schema.org metadata.

---

## 5. Routing

### 5.1 Public Routes

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Public mentor listing |
| `/login` | `app/login/page.tsx` | `?mode=login\|signup` via query param |
| `/signup` | `app/signup/page.tsx` | Immediately redirects to `/login?mode=signup` |
| `/forgot-password` | `app/forgot-password/page.tsx` | |
| `/reset-password` | `app/reset-password/page.tsx` | Reads `?token=` |
| `/unsubscribe` | `app/unsubscribe/page.tsx` | Token-based email unsubscribe |
| `/emails` | `app/emails/page.tsx` | Static template preview page |

### 5.2 `(protected)` Route Group

Contains one file: `app/(protected)/permissions/page.tsx` — a 5-line server-side `redirect('/admin/mentors')`. There is **no `layout.tsx`** in this group; it provides zero enforcement. The name is aspirational.

### 5.3 `/admin` Routes

| Path | File | Guard |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Redirect to `/admin/mentors` |
| `/admin/mentors` | `app/admin/mentors/page.tsx` | Client-side: `isAuthenticated && isAdmin` |
| `/admin/emails` | `app/admin/emails/page.tsx` | Client-side: `isAuthenticated && isAdmin` |
| `/admin/profile` | `app/admin/profile/page.tsx` | Client-side: `isAuthenticated` only |

`app/admin/layout.tsx` only sets `robots: { index: false, follow: false }`. No SSR auth check.

### 5.4 Guard Pattern

Every admin page uses the same client-side `useEffect` (`mentors/page.tsx:64-68`):

```ts
useEffect(() => {
  if (!authLoading && (!isAuthenticated || !isAdmin)) router.push('/login');
}, [authLoading, isAuthenticated, isAdmin, router]);
```

The page's HTML ships to the browser before the redirect fires. API routes (`/api/email/*`) do **not** enforce admin role server-side.

---

## 6. Profile Management

`app/admin/profile/page.tsx` (550 lines) is the mentor self-service dashboard. Despite the `/admin` prefix, it is accessible to any authenticated mentor (not admin-only).

**Bento dashboard tabs**: `profile | availability | calendar | stats | bookings` — only `profile` is implemented; the rest render a "Coming Soon" placeholder.

**What is editable**: all bilingual fields, `slug` (auto-normalized: lowercase, spaces→hyphens, strip non-`[a-z0-9-]`), `linkedin_url`, `calendly_url`, `email`, `languages` (checkboxes), `session_time_minutes`, `session_price_usd`, `tags`, `picture_url`.

**Profile image upload**: Supabase storage bucket `mentor-pictures`, key `{mentorId}-{Date.now()}.{ext}`, `upsert: true` (`page.tsx:264-289`).

**Change notification**: every save computes a diff of changed fields (`page.tsx:332-352`) and posts to `/api/send-email` with `type='profile_update'`, notifying all active admin mentors.

**Shareable URL pattern** (in `ProfileForm.tsx:66-74`): `${origin}/?m=${slug || mentorId}` — the homepage deep-links to a mentor via `?m=`.

**Password reset**: the "Change Password" button re-invokes `/api/auth/forgot-password` with the user's own email — it sends a reset link to their inbox rather than accepting the new password in-app.

---

## 7. Mentor Application Flow

`app/components/MentorApplicationModal.tsx` — **dead code**. The file exists but is not imported anywhere in the codebase. The signup flow goes through `/login?mode=signup` → `signup_mentor` RPC instead.

The modal's intent (when it was live):
- Insert a `mentors` row with `is_active: false`
- Fire a POST to `/api/send-email` with `type: 'application'`

**Approval** today: admin manually flips `is_active` on `/admin/mentors`. There is no dedicated approval queue in the UI, though the i18n module `admin.ts` has unused strings: `pendingApplications`, `approve`, `reject`, `approveAsMentor`.

---

## 8. Email Subsystem

### 8.1 Helpers (`utils/email.ts`)

- `getResendClient()` — lazy-constructed `new Resend(process.env.RESEND_API_KEY)`.
- `getRecipientsByFilter(filter, customEmails?)` — queries `mentors WHERE is_active=true`. `'admins'` narrows by `role='admin'`; `'mentors'` and `'all'` are equivalent (all active rows including admins).
- `filterSubscribedRecipients(recipients)` — removes anyone with `!email_subscribed` or empty email.
- `sendEmailBatches(resend, emails, subject, html, from)` — 100-recipient chunks, 600 ms sleep between batches; **retains only the last batch's `resend_id`**.
- `generateUnsubscribeToken(mentorId)` — base64url-encodes `{ id, exp: Date.now() + 30 days }`. **No HMAC — forgeable.**
- `verifyUnsubscribeToken(token)` — only checks `payload.exp > Date.now()`.

### 8.2 `/api/send-email` — admin notification

**Triggers**: (1) `MentorApplicationModal` on guest application submit (dead path); (2) `app/admin/profile/page.tsx` on profile save.

Recipients: `mentors WHERE role='admin' AND is_active=true`; fallback hard-coded to `mulli2@gmail.com`.

Types:
- `'application'` → subject `[Donation Mentoring] New Mentor Application: {name_ko} ({name_en})`
- `'profile_update'` → subject with changes diff string

If `RESEND_API_KEY` is absent, logs a simulated send and returns 200 (dev convenience).

### 8.3 `/api/email/broadcast` — campaign pipeline

```
POST { subject, body, recipientFilter, customRecipients?, testMode?, testEmail? }
  → getRecipientsByFilter + filterSubscribedRecipients
  → If testMode: replace list with [testEmail]
  → Wrap body: raw HTML string with literal "UNSUBSCRIBE_TOKEN" footer (substitution NOT implemented)
  → sendEmailBatches (chunks of 100, 600ms between)
  → INSERT email_logs row (type='announcement', status='sent')
```

**No auth check** — route comment (`broadcast/route.ts:26-29`) acknowledges this as a TODO.

### 8.4 `/api/email/recipients`

GET `?filter&search&includeUnsubscribed`. Queries `mentors WHERE is_active=true ORDER BY name_ko ASC`. Server-side free-text search applied in-handler against `email`, `name_en`, `name_ko`. Returns `{ recipients, total, subscribedCount, unsubscribedCount }`.

### 8.5 `/api/email/logs`

GET `?page&limit&type`. Supabase `range()` with `count:'exact'`, ordered `sent_at DESC`. Returns paginated `EmailLog[]` with `totalPages`.

### 8.6 `/api/email/unsubscribe`

- **GET** `?token` → verify token → return mentor info + `alreadyUnsubscribed` flag
- **POST** `{ token }` → `UPDATE mentors SET email_subscribed=false, unsubscribed_at=now()`

Front-end at `/unsubscribe/page.tsx` — bilingual EN/KO UI with states `loading | invalid | valid | success | error`. No re-subscribe action available in the UI.

### 8.7 `/api/webhooks/resend`

Receives Resend delivery events. Checks for Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) when `RESEND_WEBHOOK_SECRET` is set, but **does not verify the signature** — comment says "for now we validate headers exist and proceed."

| Event | DB action |
|---|---|
| `email.sent` | `email_logs.status = 'sent'` |
| `email.delivered` | `email_logs.status = 'delivered'` |
| `email.opened` | RPC `increment_email_opens(resend_id)` |
| `email.clicked` | RPC `increment_email_clicks(resend_id)` |
| `email.bounced` | `status = 'bounced'`, `error_message = data.bounce.message` |
| `email.complained` | console.log only (TODO: auto-unsubscribe) |

### 8.8 React Email Templates (`app/emails/`)

- `AnnouncementEmail.tsx` — props: `{ subject, body, unsubscribeUrl? }`. Renders heading + pre-wrapped body text + footer.
- `components/EmailLayout.tsx` — `<Html><Head><Body>` wrapper, hard-coded header logo `https://donation-mentoring.org/logo.png`, 600 px container.
- `components/EmailFooter.tsx` — bilingual "You are receiving this email…" + optional unsubscribe link + copyright year.

**These templates are NOT used by `/api/email/broadcast`**. The broadcast route builds raw HTML inline (`broadcast/route.ts:56-63`). The templates may be intended for a future migration.

---

## 9. Mentor Display & Filtering

### 9.1 Home Page (`app/page.tsx`)

Client component (`'use client'`), wrapped in `<Suspense>` for `useSearchParams`.

Page sections (top to bottom):
1. **Hero** — parallax blobs (`scrollY * 0.1`), "How it works" 4-step grid + collapsible detailed steps
2. **Today's Mentor** — full-bleed card (`getDailyMentor`), only renders when data loaded
3. **Mentor listing** — sticky section header + `<FilterSidebar>` (desktop left, mobile drawer) + 1-2-3-4 column responsive grid

Data load: single `supabase.from('mentors').select('*').eq('is_active', true)` → `shuffleArray` → `setMentors`. Mentor list order randomizes on each page load.

Modal state is **URL-driven**: `handleOpenMentor` calls `router.push('/?m=' + (mentor.slug || mentor.id), { scroll: false })`. Selected mentor is derived from `useSearchParams().get('m')` — enables deep-linking.

Theme: `BASE_THEME` "Charcoal & Dusty Blue" (sky-600 accent). Dark mode default `true`, persisted in `localStorage('darkMode')`.

### 9.2 `MentorCard` & `MentorModal`

**MentorCard** (`app/components/MentorCard.tsx`):
- `aspect-4:3` image with gradient overlay, name+position absolutely positioned with text shadow
- Avatar fallback: colored div with initial letter if `picture_url` is missing or errored
- Horizontally scrollable tag row with chevron scroll buttons; visibility state managed via `scroll` event listener
- Bilingual fallback: `lang==='en' ? name_en : name_ko` then cross-lang fallback then `'No Name'`
- `unoptimized={picture_url.includes('supabase.co')}` — bypasses Next.js image optimizer for Supabase storage URLs

**MentorModal** (`app/components/MentorModal.tsx`):
- Dual-layer hero image: blurred+scaled background div + `object-contain` foreground `<Image>` (handles non-square photos)
- Body scroll locked via `document.body.style.overflow='hidden'` while open
- Copy-link button: copies `${origin}/?m=${slug || id}`, shows 2-second check-mark confirmation
- Action buttons: Calendly (if URL), Contact (mailto with bilingual subject), LinkedIn

### 9.3 FilterSidebar + `useMentorFilters`

**Sidebar dimensions** (`app/components/FilterSidebar.tsx`):
1. **Expertise (tags)** — multi-select checkboxes, initial 10 shown, show-more with scroll fade
2. **Location** — multi-select checkboxes
3. **Session length** — radio: null / 30 / 45 / 60 min
4. **Price range** — `[min, max]` 0-100 USD, dual number inputs + single-handle range slider

**Filter hook** (`utils/useMentorFilters.ts:88-122`) is pure `useMemo` derivation — it does **not** sync with URL params despite the name. Filter state is ephemeral React state (lost on reload).

Filter pipeline (applied in order):
1. Language match — checks `mentor.languages[]` for substrings (`korean|한국어|ko` vs `english|영어|en`). Switching UI language hides mentors whose `languages` array doesn't match.
2. Free-text search — lowercase substring across name/position/location/tags
3. Expertise — normalized tag match (lowercase + strip spaces), OR semantics
4. Location — exact string match
5. Session length — exact integer equality
6. Price range — only applies to mentors that have a `session_price_usd` value

Tag display normalization (`useMentorFilters.ts:182-196`): prefer version with spaces, then prefer title case.

### 9.4 Helpers (`utils/helpers.ts`)

- `shuffleArray<T>` — Fisher-Yates, returns new array
- `getDailyMentor(mentors)` (`helpers.ts:61-92`):
  - Sort by `id` ascending (deterministic order)
  - Seed = `year*10000 + month*100 + day` using **UTC** date
  - `selectedIndex = seed % mentors.length`
  - Rolls over at UTC midnight (09:00 KST — not local midnight)
- `getMentorDisplay(mentor, lang)` — returns localized `{ name, description, position, location, company }` with EN↔KO fallback
- `ensureProtocol(url)` — prepends `https://` if missing

### 9.5 i18n (`utils/i18n/`)

Six in-memory TypeScript modules: `common`, `auth`, `dashboard`, `mentor`, `admin`, `home`. Each exports `{ en: {...}, ko: {...} }`.

**Aggregation** (`utils/i18n/index.ts`): flat-merged via spread into `translations.en` and `translations.ko` in order: `common → auth → dashboard → mentor → admin → home`. **Key collisions across modules are silently overwritten by the last module.** For example, `home.adminContact` overwrites `auth.adminContact`.

**Switching and persistence**: each page that uses i18n has its own `useState<'en'|'ko'>` initialized from `localStorage.getItem('language')` (default `'ko'`). `<TopNav>` exposes a `<select>` with `🇰🇷 KO` / `🇺🇸 EN`. No URL-based locale, no cookie, no server-side awareness.

Namespaced export (`i18n.en.auth.login`) exists in `index.ts` but is unused in the codebase.

### 9.6 SEO (`utils/seo.ts`, `app/robots.ts`, `app/sitemap.ts`)

- **`siteConfig`**: `url` from `NEXT_PUBLIC_SITE_URL` (fallback `https://www.donation-mentoring.org`), bilingual descriptions, `locale='en_US'`, `alternateLocale='ko_KR'`
- **`aiCrawlers`**: explicit allowlist — `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `Bingbot`
- **JSON-LD** (`homePageJsonLd`): `@graph` array with Organization + Website + Service schemas (free, price=0 USD)
- **`robots.ts`**: disallows `protectedRoutes` (`/admin`, `/login`, `/signup`, etc.); emits per-AI-bot allow rules redundantly
- **`sitemap.ts`**: single entry — homepage only; mentor profiles are `?m=` modal state, not standalone routes
- **`app/layout.tsx`**: `<html lang>` hard-coded `'en'` (from `siteConfig.language`). Naver site verification tag hard-coded. Fonts: `Source_Sans_3` + `Noto_Sans_KR` (latin subset only even for the Korean font).

---

## 10. Admin Dashboard

### 10.1 `/admin/mentors` — Mentor CRUD

**List & filter**: all mentors ordered by `name_ko`; status pills (`all | active | inactive`) double as live counters; free-text search on name/position.

**Create / Edit** via modal — bilingual side-by-side fields for all text pairs, language checkboxes, tags CSV input, slug auto-normalization, photo upload to `mentor-pictures` bucket.

**Toggle active/inactive**: inline flip on the row card, no modal required.

**Delete**: confirmation modal → hard `DELETE` from DB (no soft-delete).

**Approval** = setting `is_active = true`. No formal queue UI despite i18n strings suggesting one was planned.

### 10.2 `/admin/emails` — Broadcast Composer

Three tabs:

**Compose**: subject input, 10-row body textarea, recipient radio buttons with live subscription counts, custom `react-select` multi-picker (subscribed mentors only), preview modal, send confirmation modal listing first 5 recipients + "+N more", amber warning banner when unsubscribed users exist in filter.

**History**: fetches `/api/email/logs?limit=50` on tab activation. Per-entry: subject, locale-formatted timestamp, color-coded status badge (`delivered=green, bounced=red`), recipient count, opens, clicks, open-rate %.

**Subscriptions**: two scrollable lists — subscribed (green count) and unsubscribed (amber count). Shows name, email, role badge, `unsubscribed_at` timestamp. No resubscribe action available in the UI.

### 10.3 `/admin/profile`

Same `app/admin/profile/page.tsx` as all mentors use. Admins have `role='admin'` on their `mentors` row, making them both admin and a publicly-displayed mentor.

---

## 11. Build & CI

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
npm test             # Jest
npm run test:coverage

supabase start       # Docker containers
supabase db reset    # migrations + seed
supabase stop
```

Run a single test file: `npm test -- <path>`

Local services: App `3000`, Supabase Studio `54323`, Inbucket (email) `54324`.

Test accounts after `supabase db reset`: `test.mentor@example.com`, `test.pending@example.com`, `test.admin@example.com`.

GitHub Actions workflows at `.github/workflows/`:
- `build-lint-test.yml` — runs on push/PR to main
- `supabase-migrate.yml` — production schema deployment

---

## 12. Findings & Gotchas

Issues discovered during research, grouped by severity.

### Schema / Data Model

**F1 — `profiles` and `admins` tables not in repo migrations.**
`handle_new_user` (inserts `profiles`) and `update_admin_password`/`update_admin_reset_token` (read `admins`) reference tables created outside the migration history. `app/admin/profile/page.tsx:137` actively queries `profiles`. These must be manually created in the production Supabase project. `supabase db reset` locally will leave these functions broken.

**F2 — `mentors.slug` referenced but never added via `ALTER TABLE`.**
`signup_mentor` RPC writes to `slug` and `types/mentor.ts:19` declares it. No migration adds the column. Either it was added manually in production or signup RPCs currently error. (`supabase/migrations/20260106000005_signup_mentor.sql`)

**F3 — Open RLS on `mentors`.**
All four CRUD operations have `USING (true)` policies (`init_schema.sql:328-344`). Anyone with the anon key can read, insert, update, or delete any mentor row. Auth security relies entirely on SECURITY DEFINER RPCs being the only path — but open RLS means a direct `supabase.from('mentors').delete()` from the browser works too.

### Authentication / Authorization

**F4 — Two parallel auth systems coexist.**
Custom bcrypt auth on `mentors.password` is live. The Supabase Auth path (`auth.users → profiles → handle_new_user`) is dormant. `app/admin/profile/page.tsx:134-145` still contains the legacy `profiles` query as a fallback comment.

**F5 — No server-side session; all guards are client-side.**
`sessionStorage` session is lost on tab close. Admin page HTML ships to the browser before `useEffect` redirect fires. No middleware exists. API routes do not check the caller's role.

**F6 — Email APIs lack server-side auth.**
`/api/email/broadcast`, `/api/email/recipients`, `/api/email/logs`, and `/api/email/unsubscribe` all execute under the anon key without verifying the caller is an admin. Comment in `broadcast/route.ts:26-29` acknowledges this.

**F7 — Unsubscribe token is unsigned (forgeable).**
`generateUnsubscribeToken(mentorId)` returns base64url of `{ id, exp }` with no HMAC (`utils/email.ts:80-87`). Anyone who knows a mentor's UUID can craft a valid token and unsubscribe them.

### Email Subsystem

**F8 — `UNSUBSCRIBE_TOKEN` string literal in broadcast HTML.**
`/api/email/broadcast/route.ts:61` embeds the literal string `UNSUBSCRIBE_TOKEN` in the footer HTML. Per-recipient token substitution is not implemented. Every recipient gets the same non-functional unsubscribe link.

**F9 — React Email templates not used by the broadcast pipeline.**
`AnnouncementEmail.tsx` + `EmailLayout` + `EmailFooter` exist but are never imported by `broadcast/route.ts`, which builds raw HTML inline.

**F10 — Resend webhook signature verification is a stub.**
`app/api/webhooks/resend/route.ts:24-27` checks that Svix headers are present but does not call the Svix verification SDK. Any POST to the endpoint is accepted.

**F11 — Batch email loses Resend ID correlation.**
`sendEmailBatches` (`utils/email.ts:135`) only retains the `resend_id` from the final batch. For campaigns with >100 recipients, Resend delivery events for all earlier batches cannot update `email_logs.opens`/`email_logs.clicks` via the webhook.

### Dead Code

**F12 — `MentorApplicationModal` is not imported anywhere.**
`app/components/MentorApplicationModal.tsx` exists but has zero import references in the codebase. The live signup path is `/login?mode=signup` → `signup_mentor` RPC.

**F13 — `linkMentorProfile` and `needsMentorLink` are dead stubs.**
`useAuth.ts:178-191`: `linkMentorProfile` only logs; `needsMentorLink` is hard-coded `false`. Any UI referencing these is unreachable.

### i18n / Internationalization

**F14 — i18n flat-merge silently overwrites colliding keys.**
`translations[lang]` is built by spreading 6 modules in fixed order. Later modules win on collision. Known example: `home.adminContact` overwrites `auth.adminContact` (`utils/i18n/index.ts`).

**F15 — `<html lang>` is always `'en'`.**
`app/layout.tsx:64` sets `<html lang={siteConfig.language}>` where `siteConfig.language = 'en'`. SSR'd HTML declares English even for Korean-speaking users. Language switching is purely client-side JS.

### Other

**F16 — Filter state is not URL-persisted.**
`useMentorFilters` is a pure derivation hook despite its name. Tag/location/session/price filter selections are local React state — lost on reload. Only the selected mentor (`?m=`) is in the URL.

**F17 — "Today's Mentor" rotates at UTC midnight (09:00 KST).**
`getDailyMentor` uses `getUTCDate()` intentionally for global determinism (`helpers.ts:67-71`), but Korean users will see the mentor change mid-morning rather than at midnight local time.

**F18 — Super-admin email hard-coded in two places.**
`mulli2@gmail.com` appears in `handle_new_user` auto-promotion (`init_schema.sql:62`) and as fallback recipient in `/api/send-email` (`route.ts:38`).

---

## 13. Cross-Reference Index

| Topic | Location |
|---|---|
| `mentors` table schema | `supabase/migrations/20260106000000_init_schema.sql:237-267` |
| `email_logs` table schema | `supabase/migrations/20260107000000_email_system.sql:10-44` |
| `signup_mentor` RPC | `supabase/migrations/20260106000005_signup_mentor.sql` |
| `login_mentor` RPC | `supabase/migrations/20260106000002_secure_mentor_auth.sql` |
| `reset_mentor_password` RPC | `supabase/migrations/20260106000003_secure_password_reset.sql` |
| `handle_new_user` trigger | `supabase/migrations/20260106000000_init_schema.sql:54-79` |
| RLS policies | `supabase/migrations/20260106000000_init_schema.sql:328-344` |
| `useAuth` hook interface | `hooks/useAuth.ts:29-54` |
| Admin guard pattern | `app/admin/mentors/page.tsx:64-68` |
| Session storage key | `hooks/useAuth.ts:61-73` |
| Broadcast pipeline | `app/api/email/broadcast/route.ts` |
| Batch send + lastResendId bug | `utils/email.ts:107-147` |
| Unsubscribe token (unsigned) | `utils/email.ts:80-98` |
| Webhook handler | `app/api/webhooks/resend/route.ts` |
| Filter pipeline order | `utils/useMentorFilters.ts:88-122` |
| `getDailyMentor` (UTC seed) | `utils/helpers.ts:61-92` |
| i18n flat-merge | `utils/i18n/index.ts` |
| SEO config | `utils/seo.ts` |
| AI crawler allowlist | `utils/seo.ts:97-115` |
| `<html lang>` hard-coded | `app/layout.tsx:64` |
| Seed password bootstrap | `supabase/seed.sql:568-572` |
