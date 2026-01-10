# 📅 Feature Request: Calendar Booking System

## Summary
Build a native calendar booking system to replace Calendly dependency, allowing mentors to set availability and mentees to book sessions directly on the platform.

## Motivation
- **Cost**: Calendly charges $10-16/user/month - expensive for a mentor marketplace
- **Control**: Full data ownership and customization
- **UX**: Seamless booking without leaving our site

## Proposed Solution

### User Stories

**As a Mentor, I want to:**
- Set my weekly availability (e.g., Mon-Fri 9am-5pm)
- Connect my Google/Outlook calendar to auto-block busy times
- Block specific dates (holidays, vacation)
- Receive notifications when someone books

**As a Mentee, I want to:**
- See a mentor's available dates on a calendar
- Select a time slot and book a session
- Receive confirmation with calendar invite
- Cancel/reschedule if needed

## Technical Design

### Database Schema (Supabase PostgreSQL)

```sql
-- Weekly availability templates
CREATE TABLE mentor_availability (
  id UUID PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id),
  day_of_week SMALLINT, -- 0-6
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'Asia/Seoul'
);

-- Actual bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  mentor_id UUID REFERENCES mentors(id),
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  booker_name TEXT,
  booker_email TEXT,
  status TEXT -- pending/confirmed/cancelled
);

-- OAuth tokens (encrypted)
CREATE TABLE mentor_calendar_tokens (
  mentor_id UUID,
  provider TEXT, -- google/microsoft
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA
);
```

### UI Wireframes

**Admin: Set Availability (Visual Time Grid)**
```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ My Availability                                        [Save]   │
├─────────────────────────────────────────────────────────────────────┤
│ Duration: [30 min]  Buffer: [15 min]  Timezone: [Asia/Seoul]       │
├─────────────────────────────────────────────────────────────────────┤
│ Weekly Time Grid (click & drag to select)                          │
│                                                                     │
│        │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                  │
│  09:00 │ ███ │ ███ │     │     │ ███ │     │     │  ← drag select  │
│  10:00 │ ███ │ ███ │     │ ███ │ ███ │     │     │                  │
│  11:00 │ ███ │ ███ │     │ ███ │ ███ │     │     │  ███ = available │
│  12:00 │     │     │     │ ███ │     │     │     │                  │
│  ...   │     │     │     │     │     │     │     │                  │
│  14:00 │ ███ │ ███ │     │ ███ │     │     │     │                  │
│  ...   │     │     │     │     │     │     │     │                  │
│  20:00 │     │     │ ███ │     │     │     │     │  ← evening ok    │
│  21:00 │     │     │ ███ │     │     │     │     │                  │
│                                                                     │
│  [Copy Mon → Tue-Fri]  [Clear All]  [Set 9-5 Weekdays]             │
├─────────────────────────────────────────────────────────────────────┤
│ [🔗 Connect Google]  [🔗 Connect Outlook]                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Key UX Features:**
- Drag to select time blocks on the grid
- Multiple non-contiguous slots per day (e.g., 9-12 AND 20-23)
- Copy a day's schedule to other days with one click
- Quick presets like "Set 9-5 Weekdays"

**User: Book Session (Calendly-style)**
```
┌────────────┬──────────────────┬────────────────┐
│  Mentor    │   Select Date    │  Select Time   │
│  ┌──────┐  │  Dec 2025  ◀ ▶   │  ┌──────────┐  │
│  │Photo │  │  Su Mo Tu We...  │  │ 9:00 AM  │  │
│  └──────┘  │   ⑨ ⑩ ⑪ ⑫     │  │10:00 AM ✓│  │
│  김멘토     │  [29] selected   │  │11:00 AM  │  │
│  30min/$30 │                  │  └──────────┘  │
└────────────┴──────────────────┴────────────────┘
```

### Security Requirements
- [ ] OAuth tokens encrypted with AES-256-GCM
- [ ] PKCE flow for Google/Microsoft OAuth
- [ ] Rate limiting on booking API
- [ ] Row Level Security on all tables

### Implementation Phases

**Phase 1: Core Booking**
- [ ] Database schema setup
- [ ] Admin availability editor
- [ ] User booking calendar UI
- [ ] Email confirmations

**Phase 2: Calendar Integration**
- [ ] Google Calendar OAuth
- [ ] Microsoft Outlook OAuth
- [ ] Auto-create events on booking
- [ ] Two-way sync (block busy times)

## Files to Create
```
app/api/availability/route.ts
app/api/bookings/route.ts
app/api/calendar/google/route.ts
app/api/calendar/microsoft/route.ts
app/components/AvailabilityEditor.tsx
app/components/BookingCalendar.tsx
app/components/TimeSlotPicker.tsx
app/components/BookingForm.tsx
utils/calendar-encryption.ts
```

## Environment Variables Needed
```
CALENDAR_TOKEN_ENCRYPTION_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
RESEND_API_KEY=
```

## Detailed Plan
See: [docs/plan/calendar-booking-feature.md](./calendar-booking-feature.md)

## How to Contribute
1. Comment on this issue if you'd like to work on a specific part
2. Fork the repo and create a branch: `feat/calendar-booking`
3. Submit PRs referencing this issue

## Labels
`enhancement` `feature-request` `help-wanted` `good-first-issue`
