# Feature: Authentication System

## Summary

Role-based authentication with **Google OAuth + Email/Password** for admins and mentors. Guests can browse and book without login. All new users must accept the platform policy before using the application.

**Priority**: High (prerequisite for Calendar Booking)
**Status**: Implemented

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
│  │       │   • Register via Google OAuth or Email           │
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
- **Policy acceptance required** for all users before using the platform

---

## Tech Stack

- **Auth Provider**: Supabase Auth
- **OAuth**: Google (via Supabase)
- **Email/Password**: Supabase Auth (with email verification)
- **Database**: Supabase PostgreSQL
- **Framework**: Next.js 16 (App Router)

---

## Database Schema

### Table: `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'mentor' CHECK (role IN ('mentor', 'admin', 'super_admin')),
    is_approved BOOLEAN DEFAULT false,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    policy_accepted_at TIMESTAMPTZ,  -- NULL = not accepted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security with SECURITY DEFINER functions to avoid recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Trigger: Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    linked_mentor_id UUID;
    user_role TEXT := 'mentor';
    user_approved BOOLEAN := false;
BEGIN
    -- Try to find mentor by email
    SELECT id INTO linked_mentor_id
    FROM public.mentors
    WHERE email = NEW.email
    LIMIT 1;

    -- If mentor found, check their status
    IF linked_mentor_id IS NOT NULL THEN
        SELECT is_active INTO user_approved
        FROM public.mentors
        WHERE id = linked_mentor_id;
    END IF;

    INSERT INTO public.profiles (id, email, display_name, avatar_url, role, is_approved, mentor_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role,
        COALESCE(user_approved, false),
        linked_mentor_id
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Auth Pages

### Login Page (`/login`)

- Google OAuth button
- Email/Password form
- "Don't have an account? Sign up" link
- "Forgot password?" link
- Guest browse link

### Signup Page (`/signup`)

- **Policy acceptance checkbox** (required to enable signup CTAs)
- Google signup button (disabled until policy accepted)
- Email signup form (disabled until policy accepted)
  - Email, Password (min 8 chars), Confirm Password
- "Already have an account? Login" link

### Forgot Password Page (`/forgot-password`)

- Email input
- Send reset link button
- Success message after sending

### Reset Password Page (`/reset-password`)

- Validates PASSWORD_RECOVERY session from Supabase
- New password + Confirm password form
- Invalid/expired link error state
- Redirects to login on success

### Policy Acceptance Modal

For existing users who haven't accepted policy:
- Modal displayed on dashboard
- Checkbox + Accept button
- Cannot dismiss without accepting

---

## Auth Flows

### Email Signup Flow

```
User visits /signup → Checks policy checkbox → Clicks "Sign up with email"
                                                        │
                                                        ▼
                                             Form expands: email, password, confirm
                                                        │
                                                        ▼
                                             Submit → signUpWithEmail()
                                                        │
                                                        ▼
                                             Supabase sends verification email
                                                        │
                                                        ▼
                                             User clicks email link
                                                        │
                                                        ▼
                                             Profile created via trigger
                                                        │
                                                        ▼
                                             Redirect to /dashboard
                                                        │
                                                        ▼
                                             Policy modal shown
                                                        │
                                                        ▼
                                             User accepts → policy_accepted_at set
```

### Google OAuth Flow (Signup)

```
User visits /signup → Checks policy checkbox → Store in sessionStorage
                                                        │
                                                        ▼
                                             Click Google button → OAuth redirect
                                                        │
                                                        ▼
                                             Return to /dashboard
                                                        │
                                                        ▼
                                             Check sessionStorage, call acceptPolicy()
                                                        │
                                                        ▼
                                             policy_accepted_at set
```

### Password Reset Flow

```
User clicks "Forgot password?" on /login → Goes to /forgot-password
                                                        │
                                                        ▼
                                             Enters email → resetPassword()
                                                        │
                                                        ▼
                                             Checks email, clicks link
                                                        │
                                                        ▼
                                             Redirected to /reset-password
                                                        │
                                                        ▼
                                             Enters new password → updatePassword()
                                                        │
                                                        ▼
                                             Redirected to /login
```

### Existing User Policy Flow

```
Existing user logs in → Dashboard loaded → policyAccepted = false
                                                        │
                                                        ▼
                                             PolicyAcceptanceModal shown
                                                        │
                                                        ▼
                                             User checks box, clicks accept
                                                        │
                                                        ▼
                                             acceptPolicy() → policy_accepted_at set
                                                        │
                                                        ▼
                                             Modal closes, dashboard accessible
```

---

## Files Structure

```
app/
├── login/
│   └── page.tsx                # ✅ Login with Google + Email
├── signup/
│   └── page.tsx                # ✅ Signup with policy checkbox
├── forgot-password/
│   └── page.tsx                # ✅ Request password reset
├── reset-password/
│   └── page.tsx                # ✅ Set new password
├── dashboard/
│   └── page.tsx                # ✅ Mentor dashboard with PolicyAcceptanceModal
├── admin/
│   ├── page.tsx                # Admin dashboard
│   └── users/
│       └── page.tsx            # Super Admin: user management
├── components/
│   ├── TopNav.tsx              # ✅ Role-based navigation
│   ├── PolicyAcceptanceModal.tsx # ✅ Policy acceptance modal
│   └── ProfileForm.tsx         # Profile edit form

hooks/
└── useAuth.ts                  # ✅ Auth hook with all methods

utils/
├── supabase.ts                 # Supabase client
└── i18n.ts                     # ✅ Translations including auth keys

supabase/
├── migrations/
│   ├── 20260105000001_baseline_schema.sql  # ✅ Base tables
│   └── 20260105000002_auth_profiles.sql    # ✅ Profiles + auth
└── seed.sql                    # ✅ Test data
```

---

## useAuth Hook API

```typescript
interface UseAuthReturn {
  // State
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;

  // Policy
  policyAccepted: boolean;
  acceptPolicy: () => Promise<void>;

  // Auth methods
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

---

## Translation Keys

Auth-related keys in `utils/i18n.ts`:

| Key | Korean | English |
|-----|--------|---------|
| `signUp` | 회원가입 | Sign Up |
| `signUpSubtitle` | 계정을 만들어 시작하세요 | Get started with your account |
| `alreadyHaveAccount` | 이미 계정이 있으신가요? | Already have an account? |
| `dontHaveAccount` | 계정이 없으신가요? | Don't have an account? |
| `signUpWithGoogle` | Google로 회원가입 | Sign up with Google |
| `signUpWithEmail` | 이메일로 회원가입 | Sign up with email |
| `createAccount` | 계정 만들기 | Create Account |
| `email` | 이메일 | Email |
| `password` | 비밀번호 | Password |
| `confirmPassword` | 비밀번호 확인 | Confirm Password |
| `logIn` | 로그인 | Log In |
| `loginWithGoogle` | Google로 로그인 | Sign in with Google |
| `forgotPassword` | 비밀번호를 잊으셨나요? | Forgot password? |
| `forgotPasswordTitle` | 비밀번호 재설정 | Reset Your Password |
| `forgotPasswordSubtitle` | 가입 시 사용한 이메일을 입력하세요 | Enter the email you used to sign up |
| `sendResetLink` | 재설정 링크 보내기 | Send Reset Link |
| `resetLinkSent` | 이메일을 확인해주세요. 재설정 링크를 보냈습니다. | Check your email. We sent you a reset link. |
| `resetPassword` | 비밀번호 재설정 | Reset Password |
| `resetPasswordTitle` | 새 비밀번호 설정 | Set New Password |
| `resetPasswordSubtitle` | 새 비밀번호를 입력하세요 | Enter your new password |
| `newPassword` | 새 비밀번호 | New Password |
| `passwordResetSuccess` | 비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다. | Your password has been changed. Redirecting to login. |
| `backToLogin` | 로그인으로 돌아가기 | Back to Login |
| `acceptPolicy` | Donation Mentoring의 이용약관에 동의합니다 | I accept Donation Mentoring's terms and policy |
| `policyRequired` | 계속하려면 이용약관에 동의해주세요 | Please accept the terms to continue |
| `policyAcceptanceRequired` | 이용약관 동의 필요 | Policy Acceptance Required |
| `policyAcceptanceMessage` | 서비스를 이용하시려면 이용약관에 동의해주세요. | Please accept our terms and policy to continue using the service. |
| `acceptAndContinue` | 동의하고 계속하기 | Accept and Continue |
| `invalidCredentials` | 이메일 또는 비밀번호가 올바르지 않습니다. | Invalid email or password. |
| `passwordMismatch` | 비밀번호가 일치하지 않습니다. | Passwords do not match. |
| `passwordTooShort` | 비밀번호는 최소 8자 이상이어야 합니다. | Password must be at least 8 characters. |
| `emailAlreadyExists` | 이미 가입된 이메일입니다. | This email is already registered. |
| `signUpSuccess` | 가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요. | Sign up complete! Please check your email to verify your account. |
| `or` | 또는 | or |

---

## Supabase Configuration

### Auth Settings (Dashboard)

1. **Enable Email Provider**
   - Email confirmations: ON
   - Double confirm email changes: ON

2. **Enable Google Provider**
   - Configure Google Cloud OAuth credentials
   - Set authorized redirect URIs

3. **URL Configuration**
   - Site URL: `http://localhost:3000` (dev) / production URL
   - Redirect URLs:
     - `http://localhost:3000/dashboard`
     - `http://localhost:3000/reset-password`
     - Production equivalents

---

## Security Checklist

- [x] Google OAuth supported
- [x] Email/Password with verification
- [x] RLS policies with SECURITY DEFINER to avoid recursion
- [x] Password minimum 8 characters
- [x] Policy acceptance tracking
- [x] Session-based auth state
- [ ] Rate limiting on auth endpoints (Supabase default)
- [ ] HTTPS only (Vercel default)

---

## Seed Data (Local Development)

```sql
-- Real mentors (for testing with actual accounts)
INSERT INTO public.mentors (name_en, name_ko, email, ...) VALUES
  ('TK Kim', 'TK 김', 'tk.hfes@gmail.com', ...),
  ('Jaedong Shin', '신재동', 'mulli2@gmail.com', ...);

-- Test accounts
INSERT INTO public.mentors (name_en, name_ko, email, ...) VALUES
  ('Test Mentor', '테스트 멘토', 'test.mentor@example.com', ...),      -- approved
  ('Pending Mentor', '대기 멘토', 'test.pending@example.com', ...),    -- not approved
  ('Test Admin', '테스트 관리자', 'test.admin@example.com', ...);      -- admin
```

---

## Labels

`enhancement` `security` `high-priority` `completed`
