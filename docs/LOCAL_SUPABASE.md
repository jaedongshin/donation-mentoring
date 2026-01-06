# Local Supabase Development Guide

## Prerequisites

- Docker Desktop running
- Supabase CLI installed (`brew install supabase/tap/supabase`)

## Quick Start

```bash
# Start local Supabase (Docker containers)
supabase start

# Reset database (apply migrations + seed data)
supabase db reset

# Stop when done
supabase stop
```

## Local URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Studio** | http://localhost:54323 | Database UI, table editor |
| **API** | http://localhost:54321 | Supabase API endpoint |
| **Inbucket** | http://localhost:54324 | Email inbox for testing |
| **Database** | localhost:54322 | Direct Postgres connection |

## Migration Scripts

We have 2 migration files:

### 1. `20260105000001_baseline_schema.sql`
Core business data tables:
- `mentors` - Mentor profiles (bilingual fields, contact info, etc.)
- `reviews` - Mentor reviews
- `app_config` - Application settings

### 2. `20260105000002_auth_profiles.sql`
Authentication layer:
- `profiles` - User profiles linked to Supabase Auth
- `handle_new_user()` trigger - Auto-creates profile on signup
- RLS policies with SECURITY DEFINER functions

**Why 2 files?**
- Dependency order: profiles references mentors (FK)
- Logical separation: business data vs auth infrastructure
- Easier debugging: auth issues isolated

## Seed Data

`supabase/seed.sql` creates test data:

| Email | Type | Notes |
|-------|------|-------|
| tk.hfes@gmail.com | Real | TK Kim |
| mulli2@gmail.com | Real | Jaedong Shin |
| test.mentor@example.com | Test | Approved mentor |
| test.pending@example.com | Test | Pending mentor |
| test.admin@example.com | Test | Admin user |

## Testing Auth Locally

### Email/Password Flow
1. Go to http://localhost:3000/signup
2. Sign up with any email (e.g., `test@test.com`)
3. Check email at http://localhost:54324 (Inbucket)
4. Click verification link
5. Log in at http://localhost:3000/login

## Common Commands

```bash
# Check status
supabase status

# View logs
supabase logs

# Access database directly
psql postgresql://postgres:postgres@localhost:54322/postgres

# Generate types from database
supabase gen types typescript --local > types/database.ts

# Create new migration
supabase migration new my_migration_name
```

## Troubleshooting

### Database won't start
```bash
supabase stop
docker system prune -f
supabase start
```

### Reset everything
```bash
supabase stop
supabase start
supabase db reset
```
