# Feature: Authentication System

## Summary

Add role-based authentication with Google OAuth for admins and mentors. Guests can browse and book without login.

**Priority**: High (prerequisite for Calendar Booking)

---

## User Roles (4-Tier Hierarchy)

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👑 Super Admin (Highest)                                   │
│  │   • All Admin permissions +                              │
│  │   • Assign/revoke admin roles                            │
│  │   • Bootstrapped via env variable                        │
│  │                                                          │
│  ├── 🛡️ Admin                                               │
│  │   │   • All Mentor permissions +                         │
│  │   │   • Approve/reject mentor applications               │
│  │   │   • Search and manage all mentors                    │
│  │   │   • View all bookings                                │
│  │   │                                                      │
│  │   └── 👤 Mentor (Authenticated)                          │
│  │       │   • Register via Google OAuth                    │
│  │       │   • Wait for admin approval                      │
│  │       │   • After approval: edit own profile only        │
│  │       │   • Set availability, connect calendar           │
│  │       │   • View own bookings                            │
│  │       │   • NO search (can't see other mentors)          │
│  │       │                                                  │
│  └───────┴── 🌐 Guest (Unauthenticated)                     │
│                 • Browse mentors                            │
│                 • Book sessions (email required)            │
│                 • Manage booking via unique link            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- No "mentee accounts" in MVP - bookers manage via unique links in emails
- Mentors must register and wait for approval (no direct adding by anyone)
- Search functionality limited to Admin/Super Admin only
- Each role inherits all permissions from lower roles

---

## Tech Stack

- **Auth Provider**: Supabase Auth
- **OAuth**: Google (via Supabase)
- **Database**: Supabase PostgreSQL
- **Framework**: Next.js 16 (App Router)

---

## Database Schema

### New Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'admin', 'super_admin')),
  mentor_id UUID REFERENCES mentors(id), -- NULL for admin/super_admin
  display_name TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE, -- For mentor approval workflow
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update mentor approval"
  ON user_profiles FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can update roles"
  ON user_profiles FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### Modify: `mentors` table

```sql
-- Link mentor to auth user
ALTER TABLE mentors ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- RLS policies
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access" ON mentors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Mentors can update own record" ON mentors FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Public can view active mentors" ON mentors FOR SELECT
  USING (is_active = true);
```

---

## Super Admin Bootstrapping

First super admin(s) are defined via environment variable:

```env
# .env.local
SUPER_ADMIN_EMAILS=owner@example.com,admin@example.com
```

**Flow:**
1. User logs in via Google OAuth
2. System checks if email is in `SUPER_ADMIN_EMAILS`
3. If match: auto-assign `super_admin` role
4. If no match: create as `mentor` (pending approval)

**Implementation:**
```typescript
// utils/auth.ts
export async function handleOAuthCallback(user: User) {
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];

  const role = superAdminEmails.includes(user.email)
    ? 'super_admin'
    : 'mentor';

  const isApproved = role === 'super_admin'; // Super admins auto-approved

  await createUserProfile({
    id: user.id,
    email: user.email,
    role,
    is_approved: isApproved,
  });
}
```

---

## UI Components

### TopNav Component (Implemented)

Role-based navigation with three variants:

| Element | Guest | Mentor | Admin/Super Admin |
|---------|-------|--------|-------------------|
| Logo | ✅ | ✅ | ✅ (Admin title) |
| Nav links (About, Mentors) | ✅ | ❌ | ❌ |
| Search | ❌ | ❌ | ✅ |
| Login button | ✅ | - | - |
| Profile dropdown | - | ✅ | ✅ |
| Language selector | ✅ | ✅ | ✅ |
| Dark mode toggle | ✅ | ✅ | ✅ |

**File:** `app/components/TopNav.tsx`

---

## UI Wireframes

### Login Page (`/login`)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🎓 Donation Mentoring                    │
│                                                             │
│              ┌─────────────────────────────────┐            │
│              │                                 │            │
│              │   Sign in to manage your        │            │
│              │   mentor profile                │            │
│              │                                 │            │
│              │   ┌─────────────────────────┐   │            │
│              │   │  🔵 Continue with Google │   │            │
│              │   └─────────────────────────┘   │            │
│              │                                 │            │
│              │   For mentors and admins only   │            │
│              │                                 │            │
│              └─────────────────────────────────┘            │
│                                                             │
│              Looking to book a session?                     │
│              → Browse mentors (no login needed)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mentor Registration (`/register`)

```
┌─────────────────────────────────────────────────────────────┐
│  🎓 Mentor Registration                          [Profile ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Complete your mentor profile to get started.               │
│  Your application will be reviewed by an admin.             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Name (KO)        [________________]                    ││
│  │  Name (EN)        [________________]                    ││
│  │                                                         ││
│  │  Company (KO)     [________________]                    ││
│  │  Company (EN)     [________________]                    ││
│  │                                                         ││
│  │  Position (KO)    [________________]                    ││
│  │  Position (EN)    [________________]                    ││
│  │                                                         ││
│  │  Description (KO) [________________]                    ││
│  │  Description (EN) [________________]                    ││
│  │                                                         ││
│  │  Photo            [Upload]                              ││
│  │  LinkedIn URL     [________________]                    ││
│  │  Calendar URL     [________________]                    ││
│  │                                                         ││
│  │  Languages        [x] Korean  [x] English               ││
│  │  Tags             [________________]                    ││
│  │                                                         ││
│  │  Session Time     [____] minutes                        ││
│  │  Session Price    [____] USD                            ││
│  │                                                         ││
│  │                              [Submit Application]       ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mentor Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎓 Donation Mentoring                             [Profile ▼] [Logout]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Profile Status ────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  ⏳ Pending Approval                                                ││
│  │  Your application is being reviewed. You'll be notified by email.  ││
│  │                                                                     ││
│  │  OR                                                                 ││
│  │                                                                     ││
│  │  ✅ Approved - Your profile is live!                                ││
│  │  [📝 Edit Profile]  [⏰ Set Availability]  [📅 Connect Calendar]    ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─ Upcoming Bookings ──────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  📅 Dec 30, 10:00 AM - John Doe (john@email.com)                   ││
│  │     Topic: Career advice                                           ││
│  │                                                                     ││
│  │  📅 Jan 2, 2:00 PM - Jane Smith (jane@email.com)                   ││
│  │     Topic: Resume review                                           ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Admin Dashboard (`/admin`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🛡️ Mentor Management          [🔍 Search]          [Profile ▼] [Logout]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Pending Applications (3) ───────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Name              Email              Submitted     Actions         ││
│  │  ─────────────────────────────────────────────────────────         ││
│  │  김새멘토          kim@email.com      2 hours ago   [✅] [❌]       ││
│  │  Park Mentor      park@email.com     1 day ago     [✅] [❌]       ││
│  │  Lee Mentor       lee@email.com      3 days ago    [✅] [❌]       ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─ Active Mentors (35) ────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Name              Email              Status    Actions            ││
│  │  ─────────────────────────────────────────────────────────         ││
│  │  기존멘토          existing@email.com Active    [Edit] [Toggle]   ││
│  │  ...                                                               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Super Admin: User Management (`/admin/users`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👑 User Management             [🔍 Search]          [Profile ▼] [Logout]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ All Users ──────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Email              Role          Status      Actions               ││
│  │  ─────────────────────────────────────────────────────────         ││
│  │  owner@site.com     Super Admin   -           [Cannot modify]      ││
│  │  admin1@email.com   Admin         Approved    [▼ Change Role]      ││
│  │  mentor1@email.com  Mentor        Approved    [▼ Change Role]      ││
│  │  mentor2@email.com  Mentor        Pending     [▼ Change Role]      ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Auth Flows

### Mentor Registration Flow

```
User clicks Login → Google OAuth → Email not in SUPER_ADMIN_EMAILS
                                          │
                                          ▼
                                   Create user_profile
                                   (role='mentor', is_approved=false)
                                          │
                                          ▼
                                   Redirect to /register
                                   (Complete profile form)
                                          │
                                          ▼
                                   Submit application
                                   (Create mentor record, linked to user)
                                          │
                                          ▼
                                   Redirect to /dashboard
                                   (Shows "Pending Approval" status)
                                          │
                                          ▼
                               Admin approves application
                                          │
                                          ▼
                               is_approved = true
                               mentor.is_active = true
                                          │
                                          ▼
                               Mentor profile visible to guests
```

### Super Admin Bootstrap Flow

```
User logs in → Google OAuth → Email in SUPER_ADMIN_EMAILS
                                    │
                                    ▼
                             Create user_profile
                             (role='super_admin', is_approved=true)
                                    │
                                    ▼
                             Redirect to /admin
```

---

## Files to Create

```
app/
├── login/
│   └── page.tsx                # Login page with Google OAuth
├── register/
│   └── page.tsx                # Mentor registration form
├── dashboard/
│   └── page.tsx                # Mentor dashboard
├── admin/
│   ├── page.tsx                # Admin dashboard (updated)
│   └── users/
│       └── page.tsx            # Super Admin: user management
├── api/
│   └── auth/
│       └── callback/
│           └── route.ts        # OAuth callback handler

components/
└── TopNav.tsx                  # ✅ Created (role-based nav)

utils/
├── auth.ts                     # Auth helpers (getUser, requireAuth)
└── supabase.ts                 # Update with auth client

middleware.ts                   # Route protection by role
types/auth.ts                   # TypeScript types
```

## Files Modified

```
app/
├── page.tsx                    # ✅ Updated (uses TopNav, removed Add Mentor CTA)
└── admin/page.tsx              # ✅ Updated (uses TopNav with search)
```

---

## Implementation Steps

### Phase 1: Supabase Auth Setup
- [ ] Enable Google OAuth in Supabase dashboard
- [ ] Configure Google Cloud Console OAuth credentials
- [ ] Set redirect URLs
- [ ] Add `SUPER_ADMIN_EMAILS` to environment variables

### Phase 2: Database
- [ ] Create `user_profiles` table
- [ ] Add `user_id` column to `mentors` table
- [ ] Set up RLS policies

### Phase 3: Auth Infrastructure
- [ ] Create `utils/auth.ts` with helpers
- [ ] Create `middleware.ts` for route protection
- [ ] Create OAuth callback handler
- [ ] Implement super admin auto-assignment

### Phase 4: Login & Registration
- [ ] Create `/login` page
- [ ] Create `/register` page (mentor application form)
- [ ] Handle OAuth callback with role assignment

### Phase 5: Dashboards
- [ ] Create `/dashboard` (mentor dashboard)
- [ ] Update `/admin` (add pending applications section)
- [ ] Create `/admin/users` (super admin user management)

### Phase 6: Approval Workflow
- [ ] Add approve/reject buttons in admin
- [ ] Send notification emails on approval
- [ ] Auto-activate mentor profile on approval

---

## Environment Variables

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Super Admin Bootstrap
SUPER_ADMIN_EMAILS=owner@example.com,admin@example.com
```

---

## Security Checklist

- [ ] Google OAuth only (no custom passwords)
- [ ] RLS policies on all tables
- [ ] Middleware protects routes by role
- [ ] Super admin bootstrap via secure env var
- [ ] Email verification implicit via Google OAuth
- [ ] HTTPS only (Vercel default)
- [ ] Rate limiting on auth endpoints

---

## Dependencies

**Requires**: Nothing (this is the foundation)

**Required by**: Calendar Booking Feature

---

## Migration Path

For existing mentors without user accounts:
1. Keep existing mentor records as-is
2. Admin can "invite" existing mentor to claim profile
3. Invited mentor logs in, email matched, profile linked
4. Or admin can continue managing unclaimed profiles

---

## Labels

`enhancement` `security` `high-priority` `help-wanted`
