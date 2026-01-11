-- Email System Migration
-- Adds email subscription preferences and email logging for broadcast system

-- 1. Add email subscription fields to mentors table
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS email_subscribed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- 2. Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email metadata
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('announcement', 'newsletter', 'notification', 'welcome')),

  -- Recipients
  recipient_filter TEXT NOT NULL CHECK (recipient_filter IN ('all', 'admins', 'mentors', 'custom')),
  recipient_emails TEXT[] NOT NULL,
  recipient_count INTEGER NOT NULL,

  -- Attachments (file names only)
  attachment_names TEXT[],

  -- Sender info
  sent_by UUID REFERENCES public.mentors(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Resend tracking
  resend_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'bounced')),

  -- Engagement metrics
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON public.email_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_mentors_email_subscribed ON public.mentors(email_subscribed) WHERE email_subscribed = true;

-- 4. RLS policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.email_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON public.email_logs
  FOR UPDATE USING (true);

-- 5. Updated_at trigger
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RPC functions for atomic counter increments (called by webhook)
CREATE OR REPLACE FUNCTION increment_email_opens(p_resend_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.email_logs
  SET opens = opens + 1, updated_at = NOW()
  WHERE resend_id = p_resend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_email_clicks(p_resend_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.email_logs
  SET clicks = clicks + 1, updated_at = NOW()
  WHERE resend_id = p_resend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
