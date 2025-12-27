# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Donation Mentoring is a bilingual (English/Korean) platform connecting mentors and mentees for donation-based mentoring sessions. Built with Next.js 16, React 19, Tailwind CSS 4, and Supabase.

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

## Environment Setup

Requires `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

### App Structure (Next.js App Router)
- `/` - Public homepage with mentor search, filtering, and modal detail view
- `/admin` - Protected admin dashboard for mentor CRUD operations

### Key Directories
- `app/` - Next.js pages and components (App Router)
- `app/components/` - Reusable UI components (e.g., MentorCard)
- `types/` - TypeScript interfaces (Mentor type definition)
- `utils/` - Utilities: Supabase client, i18n translations, helper functions

### Data Model
All mentor fields are bilingual with `_en` and `_ko` suffixes:
- `name_en/name_ko`, `description_en/description_ko`, `location_en/location_ko`, `position_en/position_ko`, `company_en/company_ko`
- Other fields: `picture_url`, `linkedin_url`, `calendly_url`, `email`, `languages[]`, `tags[]`, `is_active`, `session_time_minutes`, `session_price_usd`

### Supabase Integration
- Table: `mentors`
- Storage bucket: `mentor-pictures` (public)
- Images configured in `next.config.ts` for Supabase CDN domain

### Internationalization
- Translations in `utils/i18n.ts` with 40+ keys
- Language toggle stored in component state
- Use `getMentorDisplay()` helper from `utils/helpers.ts` to get localized mentor data

### Helper Functions (`utils/helpers.ts`)
- `ensureProtocol()` - Adds https:// to URLs
- `getMentorDisplay()` - Returns localized mentor fields based on language
- `scrollToElement()` - Smooth scroll to section
- `shuffleArray()` - Fisher-Yates shuffle for randomizing mentor order

## Code Patterns

- Client-side components use `"use client"` directive
- Search/filter operates client-side after initial data fetch
- Image uploads go to Supabase storage, URL stored in mentor record
- Modal pattern used for mentor details and admin forms
