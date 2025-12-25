# Donation Mentoring Service

## Overview
Donation Mentoring is a platform to connect mentors and mentees for donation-based mentoring sessions.

## Tech Stack
- Framework: Next.js
- Styling: Tailwind CSS
- Database & Storage: Supabase
- CMS (Source): Notion

## Key Features
- Homepage: Display list of mentors with search/filter (name, tags, location, position).
- Admin Page: Manage mentor profiles (add/edit, upload photos).
- Multi-language Support: English and Korean via i18n.
- Data Sync: Fetch initial data from Notion (Manual entry via Admin page supported as Notion API/Scraping was limited).

## Setup & Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Ensure `.env.local` contains:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Access:**
   - Homepage: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin`

## Database Schema (Supabase)
- **Table:** `mentors`
  - `id`: uuid
  - `name_en`: varchar
  - `name_ko`: varchar
  - `description_en`: text
  - `description_ko`: text
  - `location_en`: varchar
  - `location_ko`: varchar
  - `position_en`: text
  - `position_ko`: text
  - `picture_url`: text
  - `tags`: jsonb
  - `is_active`: boolean
- **Storage:** `mentor-pictures` (Public bucket)
