# Feature: Calendar Booking System

## Summary

Build a native calendar booking system allowing mentors to set availability and users to book sessions directly. Replaces Calendly dependency.

**Priority**: High
**Estimated Effort**: 7-10 days
**Prerequisite**: [01-authentication-system.md](./01-authentication-system.md)

---

## Why Build Custom?

| Solution | Cost | Issue |
|----------|------|-------|
| Calendly | $10-16/user/month | Expensive for mentor marketplace |
| TidyCal | $29 lifetime | Limited API |
| Cal.com | Free | Each mentor needs separate account |
| **Custom** | $0 | Full control, uses existing Supabase |

---

## Features

### For Mentors (Authenticated)
- Visual time grid to set weekly availability
- Drag to select multiple time blocks
- Support non-contiguous hours (9-12 AND 20-23)
- Copy schedule to other days
- Connect Google/Outlook calendar
- Auto-sync busy times

### For Bookers (Guest - No Login)
- See available dates on calendar
- Select time slot
- Enter name/email to book
- Receive confirmation email
- Manage booking via unique link (cancel/reschedule)

---

## Database Schema

### 1. `mentor_availability` - Weekly schedule template

```sql
CREATE TABLE mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, day_of_week, start_time)
);
```

### 2. `mentor_availability_overrides` - Date exceptions

```sql
CREATE TABLE mentor_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, override_date)
);
```

### 3. `bookings` - Actual appointments

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL,
  duration_minutes INT NOT NULL,

  -- Booker info (no auth required)
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  booker_phone TEXT,
  booker_message TEXT,

  -- Management
  manage_token UUID DEFAULT gen_random_uuid(), -- Unique link for booker
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  -- Calendar sync
  google_event_id TEXT,
  outlook_event_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,

  UNIQUE(mentor_id, booking_date, start_time)
);
```

### 4. `mentor_calendar_tokens` - OAuth tokens (ENCRYPTED)

```sql
CREATE TABLE mentor_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),

  -- ENCRYPTED with AES-256-GCM
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA NOT NULL,

  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  calendar_email TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mentor_id, provider)
);
```

---

## UI Wireframes

### 1. Mentor: Set Availability (Visual Time Grid)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ My Availability                                                      [Save]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Duration: [30 min ▼]   Buffer: [15 min ▼]   Timezone: [Asia/Seoul ▼]              │
│                                                                                     │
│  ┌─ Weekly Time Grid (click & drag to select) ────────────────────────────────────┐ │
│  │                                                                                 │ │
│  │        │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                              │ │
│  │  ──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤                              │ │
│  │  09:00 │ ███ │ ███ │     │     │ ███ │     │     │  ← drag to select           │ │
│  │  10:00 │ ███ │ ███ │     │ ███ │ ███ │     │     │                              │ │
│  │  11:00 │ ███ │ ███ │     │ ███ │ ███ │     │     │  ███ = available            │ │
│  │  12:00 │     │     │     │ ███ │     │     │     │                              │ │
│  │  13:00 │     │     │     │     │     │     │     │                              │ │
│  │  14:00 │ ███ │ ███ │     │ ███ │     │     │     │                              │ │
│  │  15:00 │ ███ │ ███ │     │ ███ │     │     │     │                              │ │
│  │  16:00 │ ███ │ ███ │     │     │     │     │     │                              │ │
│  │  ...   │     │     │     │     │     │     │     │                              │ │
│  │  20:00 │     │     │ ███ │     │     │     │     │  ← evening slots supported  │ │
│  │  21:00 │     │     │ ███ │     │     │     │     │                              │ │
│  │  22:00 │     │     │ ███ │     │     │     │     │                              │ │
│  │                                                                                 │ │
│  │  Quick Actions:                                                                 │ │
│  │  [Copy Mon → Tue-Fri]   [Clear All]   [Set 9-5 Weekdays]                       │ │
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌─ Calendar Sync ────────────────────────────────────────────────────────────────┐ │
│  │  [🔗 Connect Google Calendar]    Status: Not connected                         │ │
│  │  [🔗 Connect Outlook Calendar]   Status: Not connected                         │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌─ Blocked Dates ────────────────────────────────────────────────────────────────┐ │
│  │  📅 Dec 25 - Christmas [✕]   📅 Jan 1 - New Year [✕]   [+ Block date]          │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. User: Book a Session (Calendly-style)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Book a Session                                    ✕    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │                  │  │      Select a Date          │  │    Select a Time        │ │
│  │  ┌────────────┐  │  │                             │  │                         │ │
│  │  │   Photo    │  │  │  ◀  December 2025  ▶        │  │  ┌───────────────────┐  │ │
│  │  │            │  │  │                             │  │  │     9:00 AM       │  │ │
│  │  └────────────┘  │  │  Su  Mo  Tu  We  Th  Fr  Sa │  │  └───────────────────┘  │ │
│  │                  │  │      1   2   3   4   5   6  │  │  ┌───────────────────┐  │ │
│  │  김멘토           │  │   7   8  ⑨  ⑩  ⑪  ⑫  13  │  │  │     9:30 AM       │  │ │
│  │  Kim Mentor      │  │  14  ⑮  ⑯  ⑰  ⑱  ⑲  20  │  │  └───────────────────┘  │ │
│  │                  │  │  21  ㉒  ㉓  ㉔  25  26  27  │  │  ┌───────────────────┐  │ │
│  │  ──────────────  │  │  28 [29] 30  31             │  │  │    10:00 AM  ✓    │  │ │
│  │  ⏱️ 30 minutes   │  │                             │  │  └───────────────────┘  │ │
│  │  💵 $30 donation │  │  ○ = available              │  │  ┌───────────────────┐  │ │
│  │  🌐 Asia/Seoul   │  │  ● = selected               │  │  │    10:30 AM       │  │ │
│  │                  │  │                             │  │  └───────────────────┘  │ │
│  └──────────────────┘  └─────────────────────────────┘  └─────────────────────────┘ │
│                                                                                     │
│                                                             [      Next →     ]     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3. User: Enter Details

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back                         Book a Session                                 ✕    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📅 Monday, December 29, 2025                                               │   │
│  │  ⏰ 10:00 AM - 10:30 AM (KST)                                               │   │
│  │  👤 김멘토 (Kim Mentor)                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Name *                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Email *                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  What would you like to discuss? (optional)                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                             │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│                                            [  Confirm Booking - $30 Donation  ]     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Manage Booking (via unique link - NO LOGIN)

**URL**: `yoursite.com/booking/abc123def456`

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Manage Your Booking                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📅 Monday, December 29, 2025                                               │   │
│  │  ⏰ 10:00 AM - 10:30 AM (KST)                                               │   │
│  │  👤 김멘토 (Kim Mentor)                                                      │   │
│  │  Status: ✅ Confirmed                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│         [📅 Reschedule]                    [❌ Cancel Booking]                      │
│                                                                                     │
│  Need help? Contact mentor at: mentor@email.com                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Requirements

### OAuth Token Security

```typescript
// AES-256-GCM encryption for tokens
const ENCRYPTION_KEY = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

function encryptToken(token: string): Buffer {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  // ... encryption logic
}
```

### Security Checklist

- [ ] OAuth tokens encrypted with AES-256-GCM
- [ ] PKCE flow for Google/Microsoft OAuth
- [ ] Server-side token exchange only
- [ ] Rate limiting: 3 bookings/email/day, 5 attempts/IP/hour
- [ ] Input validation with Zod
- [ ] RLS policies on all tables
- [ ] Unique booking tokens (UUID) for manage links

---

## Files to Create

```
app/
├── booking/
│   └── [token]/
│       └── page.tsx            # Manage booking page
├── api/
│   ├── availability/
│   │   └── route.ts            # GET/POST mentor availability
│   ├── bookings/
│   │   └── route.ts            # GET/POST/DELETE bookings
│   └── calendar/
│       ├── google/
│       │   └── route.ts        # Google OAuth flow
│       └── microsoft/
│           └── route.ts        # Microsoft OAuth flow

app/components/
├── AvailabilityEditor.tsx      # Visual time grid
├── BookingCalendar.tsx         # Date picker
├── TimeSlotPicker.tsx          # Time slot list
├── BookingForm.tsx             # Booker details form
└── BookingConfirmation.tsx     # Success screen

utils/
├── calendar-encryption.ts      # Token encrypt/decrypt
└── calendar-sync.ts            # Google/Outlook API calls
```

## Files to Modify

```
app/dashboard/page.tsx          # Add availability editor
app/components/MentorModal.tsx  # Add booking UI
```

---

## Implementation Steps

### Phase 1: Core Booking (Days 1-4)

- [ ] Create database tables and migrations
- [ ] Build AvailabilityEditor component
- [ ] Add to mentor dashboard
- [ ] Create booking API routes
- [ ] Build BookingCalendar + TimeSlotPicker
- [ ] Build BookingForm
- [ ] Add booking UI to MentorModal
- [ ] Create manage booking page

### Phase 2: Email Notifications (Day 5)

- [ ] Setup Resend for email
- [ ] Confirmation email template
- [ ] Include .ics attachment
- [ ] Include manage booking link

### Phase 3: Google Calendar (Days 6-7)

- [ ] Create Google Cloud OAuth app
- [ ] Build OAuth flow
- [ ] Encrypt and store tokens
- [ ] Create calendar events on booking
- [ ] Fetch busy times for availability

### Phase 4: Outlook Calendar (Days 8-9)

- [ ] Register Azure AD app
- [ ] Build Microsoft OAuth flow
- [ ] Create events via Graph API

### Phase 5: Polish (Day 10)

- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Testing

---

## Environment Variables

```env
# Encryption (generate: openssl rand -hex 32)
CALENDAR_TOKEN_ENCRYPTION_KEY=

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft Graph OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=noreply@yoursite.com
```

---

## Booking Flow

```
User selects time
        │
        ▼
┌──────────────────┐
│ Validate slot    │
│ still available  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Create booking   │────▶│ Send confirmation│
│ generate token   │     │ email + .ics     │
└────────┬─────────┘     │ + manage link    │
         │               └──────────────────┘
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Mentor has       │─Yes─▶│ Create event in │
│ calendar linked? │     │ Google/Outlook   │
└────────┬─────────┘     └──────────────────┘
         │ No
         ▼
┌──────────────────┐
│ Done (mentor     │
│ uses .ics)       │
└──────────────────┘
```

---

## Dependencies

**Requires**: Authentication System (01-authentication-system.md)

**Required by**: Nothing (standalone feature)

---

## How to Contribute

1. Comment on the GitHub issue to claim a task
2. Fork the repo
3. Create branch: `feat/calendar-booking`
4. Submit PR referencing this plan

## Labels

`enhancement` `feature-request` `help-wanted`
