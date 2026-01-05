# Donation Mentoring Platform

A Next.js application for connecting mentors with mentees.

## Local Development Setup

### Prerequisites

- Node.js 18+
- Docker Desktop running
- Supabase CLI: `brew install supabase/tap/supabase`

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

This configures your app to use local Supabase Docker containers. The example file contains pre-configured local development values that work out of the box.

### 3. Start local Supabase

```bash
supabase start      # Start Docker containers
supabase db reset   # Apply migrations + seed test data
```

### 4. Start the dev server

```bash
npm run dev
```

### 5. Access local services

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Your Next.js app |
| Supabase Studio | http://localhost:54323 | Database UI, table editor |
| Inbucket | http://localhost:54324 | Test email inbox |

### Google OAuth (Optional)

Google login requires extra setup. See [docs/LOCAL_SUPABASE.md](docs/LOCAL_SUPABASE.md#google-oauth-optional).

### When done

```bash
supabase stop
```

## Test Accounts (Local)

After running `supabase db reset`, these test accounts are available:

| Email | Type | Notes |
|-------|------|-------|
| test.mentor@example.com | Test | Approved mentor |
| test.pending@example.com | Test | Pending mentor |
| test.admin@example.com | Test | Admin user |

## Common Commands

```bash
# Check Supabase status
supabase status

# Reset database (reapply migrations + seed)
supabase db reset

# View Supabase logs
supabase logs

# Run tests
npm test
```

## Learn More

- [Local Supabase Guide](docs/LOCAL_SUPABASE.md) - Detailed local development docs
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Supabase features and API

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
