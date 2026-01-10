# Calendar Booking Feature - Architecture Plan

## Executive Summary

Build a calendar booking system where:
1. **Admins/Mentors** set weekly availability schedules
2. **Users** view availability on mentor card modal and book time slots
3. **Integrations** sync with Google Calendar and Outlook via OAuth

---

## Solution Comparison

### External Services

| Solution | Pricing | API | Self-Host | Pros | Cons |
|----------|---------|-----|-----------|------|------|
| **Calendly** | $10-16/user/mo | REST + Webhooks | No | Polished UX, trusted | Per-seat cost, limited customization |
| **TidyCal** | $29 lifetime | REST + OAuth2 | No | One-time cost, AppSumo deal | Smaller team, less enterprise features |
| **Cal.com** | Free (OSS) | Full REST API | Yes | Open source, white-label, full control | Self-hosting complexity |

### Recommendation: **Hybrid Approach**

**Phase 1**: Custom-built with Supabase (full control, no vendor lock-in)
**Phase 2**: Optional Cal.com embed for advanced features

**Rationale**:
- Your existing Supabase stack handles this well
- No per-seat costs (important for mentor marketplace)
- Full data ownership and security control
- KISS: Build what you need, not a full scheduling platform

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Admin Page              │  Home Page (Mentor Modal)            │
│  ┌──────────────────┐    │  ┌─────────────────────────────┐     │
│  │ Weekly Schedule  │    │  │ Availability Calendar       │     │
│  │ ┌──┬──┬──┬──┬──┐ │    │  │ ┌───┬───┬───┬───┬───┬───┐  │     │
│  │ │M │T │W │T │F │ │    │  │ │ 9 │10 │11 │12 │ 1 │ 2 │  │     │
│  │ │9-│9-│  │9-│9-│ │    │  │ │ ✓ │ ✓ │ ✗ │ ✓ │ ✗ │ ✓ │  │     │
│  │ │5 │5 │  │5 │3 │ │    │  │ └───┴───┴───┴───┴───┴───┘  │     │
│  │ └──┴──┴──┴──┴──┘ │    │  │ [Book 10:00 AM] button     │     │
│  └──────────────────┘    │  └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/availability                                               │
│    GET  - Fetch mentor's available slots for date range          │
│    POST - Save mentor's weekly schedule (admin)                  │
│                                                                  │
│  /api/bookings                                                   │
│    GET  - Fetch bookings for mentor/user                         │
│    POST - Create new booking                                     │
│    DELETE - Cancel booking                                       │
│                                                                  │
│  /api/calendar/oauth                                             │
│    GET  - Initiate OAuth flow (Google/Microsoft)                 │
│    POST - Handle callback, store encrypted tokens                │
│                                                                  │
│  /api/calendar/sync                                              │
│    POST - Create event in connected calendar                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├── mentor_availability (weekly schedule templates)             │
│  ├── mentor_calendar_tokens (encrypted OAuth tokens)             │
│  ├── bookings (actual appointments)                              │
│  └── booking_notifications (email/reminder queue)                │
│                                                                  │
│  Security:                                                       │
│  ├── Row Level Security (RLS) policies                           │
│  ├── Encrypted columns (pgcrypto)                                │
│  └── Audit logging                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│  Google Calendar API          │  Microsoft Graph API             │
│  ├── OAuth 2.0 PKCE           │  ├── OAuth 2.0 PKCE              │
│  ├── Scopes:                  │  ├── Scopes:                     │
│  │   calendar.events          │  │   Calendars.ReadWrite         │
│  │   calendar.readonly        │  │   Calendars.Read              │
│  └── Webhooks for sync        │  └── Subscriptions for sync      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

```sql
-- 1. Weekly availability templates (mentor sets once, applies weekly)
CREATE TABLE mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, day_of_week, start_time) -- No duplicate slots
);

-- 2. Specific date overrides (holidays, special hours)
CREATE TABLE mentor_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false, -- false = blocked, true = special hours
  start_time TIME, -- NULL if is_available = false
  end_time TIME,
  reason TEXT, -- "Holiday", "Vacation", etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, override_date)
);

-- 3. Actual bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL,
  duration_minutes INT NOT NULL,

  -- Booker info (no auth required - public booking)
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  booker_phone TEXT,
  booker_message TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Calendar sync
  google_event_id TEXT,
  outlook_event_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Prevent double booking
  UNIQUE(mentor_id, booking_date, start_time)
);

-- 4. OAuth tokens (ENCRYPTED - security critical)
CREATE TABLE mentor_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),

  -- Encrypted with pgcrypto - NEVER store plain tokens
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA NOT NULL,

  -- Token metadata (safe to store plain)
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  calendar_email TEXT, -- Which calendar account is connected

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, provider)
);

-- 5. Notification queue
CREATE TABLE booking_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('confirmation', 'reminder_24h', 'reminder_1h', 'cancellation')),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_availability_mentor ON mentor_availability(mentor_id, day_of_week);
CREATE INDEX idx_bookings_mentor_date ON bookings(mentor_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(status) WHERE status = 'confirmed';
CREATE INDEX idx_notifications_pending ON booking_notifications(sent_at) WHERE sent_at IS NULL;
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Availability: Public read, mentor/admin write
CREATE POLICY "Public can view active availability" ON mentor_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Mentors can manage own availability" ON mentor_availability
  FOR ALL USING (mentor_id = auth.uid()); -- Requires Supabase Auth

-- Bookings: Booker can view own, mentor can view all theirs
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Bookers can view own bookings" ON bookings
  FOR SELECT USING (booker_email = current_setting('request.jwt.claims')::json->>'email');

-- Tokens: ONLY mentor can access own tokens (critical security)
CREATE POLICY "Mentor can manage own tokens" ON mentor_calendar_tokens
  FOR ALL USING (mentor_id = auth.uid());
```

---

## Security Requirements

### 1. OAuth Token Security

```typescript
// Environment variables (NEVER in code)
const ENCRYPTION_KEY = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY; // 32-byte key

// Encrypt before storing
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function encryptToken(token: string): { encrypted: Buffer; iv: Buffer } {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([iv, authTag, encrypted]),
    iv
  };
}

function decryptToken(encryptedData: Buffer): string {
  const iv = encryptedData.subarray(0, 16);
  const authTag = encryptedData.subarray(16, 32);
  const encrypted = encryptedData.subarray(32);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### 2. OAuth Best Practices

| Practice | Implementation |
|----------|----------------|
| **PKCE** | Required for all OAuth flows (prevents code interception) |
| **Minimal scopes** | Request only `calendar.events`, not full account access |
| **Token rotation** | Refresh tokens before expiry, revoke on disconnect |
| **Server-side exchange** | Never expose client_secret to browser |
| **Secure storage** | AES-256-GCM encryption with separate key management |

### 3. Booking Security

```typescript
// Rate limiting
const BOOKING_LIMITS = {
  perEmail: 3,      // Max 3 bookings per email per day
  perMentor: 10,    // Max 10 bookings per mentor per day
  perIP: 5,         // Max 5 booking attempts per IP per hour
};

// Input validation
const bookingSchema = z.object({
  mentorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().max(500).optional(),
});

// CSRF protection
// Use Next.js built-in CSRF or implement double-submit cookie
```

### 4. Data Retention & GDPR

```sql
-- Auto-delete old bookings (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_bookings()
RETURNS void AS $$
BEGIN
  -- Delete completed bookings older than 2 years
  DELETE FROM bookings
  WHERE status IN ('completed', 'cancelled', 'no_show')
    AND created_at < NOW() - INTERVAL '2 years';

  -- Delete orphaned notifications
  DELETE FROM booking_notifications
  WHERE booking_id NOT IN (SELECT id FROM bookings);
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly cleanup
SELECT cron.schedule('cleanup-bookings', '0 3 * * 0', 'SELECT cleanup_old_bookings()');
```

---

## UX Flow

### Admin: Set Availability

```
┌─────────────────────────────────────────────────────────────────┐
│  My Availability                                    [Save]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Timezone: [Asia/Seoul ▼]                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Monday      [✓]  09:00 - 17:00  [+ Add slot]           │   │
│  │  Tuesday     [✓]  09:00 - 17:00  [+ Add slot]           │   │
│  │  Wednesday   [ ]  Not available                          │   │
│  │  Thursday    [✓]  09:00 - 17:00  [+ Add slot]           │   │
│  │  Friday      [✓]  09:00 - 15:00  [+ Add slot]           │   │
│  │  Saturday    [ ]  Not available                          │   │
│  │  Sunday      [ ]  Not available                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Session Duration: [60 min ▼]  Buffer: [15 min ▼]              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Calendar Sync                                           │   │
│  │  [🔗 Connect Google Calendar]                            │   │
│  │  [🔗 Connect Outlook Calendar]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User: Book a Session

```
┌─────────────────────────────────────────────────────────────────┐
│  Book a Session with Kim Mentor                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Select Date                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      December 2025                                       │   │
│  │  Su  Mo  Tu  We  Th  Fr  Sa                              │   │
│  │       1   2   3   4   5   6                              │   │
│  │   7   8   9  10  11  12  13                              │   │
│  │  14  15  16  17  18  19  20                              │   │
│  │  21  22  23  24  25  26  27                              │   │
│  │  28 [29] 30  31                                          │   │
│  │      ↑ selected, green = available                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 2: Select Time (Mon, Dec 29)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [09:00] [10:00] [11:00] [13:00] [14:00] [15:00]         │   │
│  │           ↑ selected                                     │   │
│  │  ░░░░░░░ = booked, greyed out                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 3: Your Information                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Name:    [________________]                             │   │
│  │  Email:   [________________]                             │   │
│  │  Phone:   [________________] (optional)                  │   │
│  │  Message: [________________]                             │   │
│  │           [________________]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Confirm Booking - $30 Donation]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Booking Flow

```
User submits booking
       │
       ▼
┌──────────────────┐
│ Validate inputs  │
│ Check slot open  │
│ Rate limit check │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│ Create booking   │─────▶│ Send confirmation│
│ status: pending  │      │ email to booker  │
└────────┬─────────┘      └──────────────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│ Mentor has       │──Yes─▶│ Create event in │
│ calendar linked? │      │ Google/Outlook   │
└────────┬─────────┘      └──────────────────┘
         │ No
         ▼
┌──────────────────┐
│ Send email to    │
│ mentor with .ics │
└──────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Booking (MVP)
- [ ] Database schema setup
- [ ] Admin: Weekly availability editor
- [ ] User: Date picker showing available dates
- [ ] User: Time slot selector
- [ ] Booking creation with email confirmation
- [ ] Basic email notifications (confirmation, reminder)

### Phase 2: Calendar Integration
- [ ] Google Calendar OAuth flow
- [ ] Microsoft Graph OAuth flow
- [ ] Encrypted token storage
- [ ] Auto-create events on booking
- [ ] Two-way sync (blocked times)

### Phase 3: Advanced Features
- [ ] Recurring availability exceptions
- [ ] Booking cancellation/rescheduling
- [ ] SMS reminders (Twilio)
- [ ] Video meeting auto-generation (Google Meet/Zoom)
- [ ] Payment integration (if not using Calendly embed)

---

## Alternative: Cal.com Embed

If building custom becomes too complex:

```tsx
// Simple Cal.com embed approach
import Cal from "@calcom/embed-react";

function MentorBooking({ mentorCalUsername }: { mentorCalUsername: string }) {
  return (
    <Cal
      calLink={mentorCalUsername}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}
```

**Pros**: Feature-complete, maintained, video conferencing built-in
**Cons**: Each mentor needs Cal.com account, less control over UX

---

## Environment Variables Required

```env
# Encryption (generate with: openssl rand -hex 32)
CALENDAR_TOKEN_ENCRYPTION_KEY=your-32-byte-hex-key

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yoursite.com/api/calendar/google/callback

# Microsoft Graph OAuth
MICROSOFT_CLIENT_ID=your-azure-app-id
MICROSOFT_CLIENT_SECRET=your-azure-secret
MICROSOFT_REDIRECT_URI=https://yoursite.com/api/calendar/microsoft/callback

# Email (for notifications)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-api-key
EMAIL_FROM=noreply@yoursite.com
```

---

## Sources

### Calendly
- [Calendly Pricing](https://calendly.com/pricing)
- [Calendly API Docs](https://developer.calendly.com/)

### TidyCal
- [TidyCal](https://tidycal.com/)
- [TidyCal API](https://tidycal.com/developer/docs/)

### Cal.com (Open Source)
- [Cal.com GitHub](https://github.com/calcom/cal.com)
- [Cal.com Docs](https://cal.com/docs)

### OAuth & Security
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Google Calendar API Scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview)
- [Auth0 Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)

### Open Source Alternatives
- [Open Source Calendly Alternatives](https://www.houseoffoss.com/post/top-3-open-source-alternatives-to-calendly-in-2025-cal-com-easy-appointments-and-croodle)
- [Easy!Appointments GDPR](https://easyappointments.org/blog/easyappointments-is-gdpr-compatible)
