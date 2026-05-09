-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'on_hold', 'paused', 'refunded');
CREATE TYPE public.subscription_plan AS ENUM ('monthly', 'yearly', 'lifetime');

-- Main subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  purchase_token text,
  product_id text,
  order_id text,
  auto_renewing boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_purchase_token ON public.subscriptions(purchase_token);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Purchase events log (audit trail from Google Play RTDN)
CREATE TABLE public.purchase_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  product_id text,
  purchase_token text,
  order_id text,
  notification_type integer,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_events_user_id ON public.purchase_events(user_id);
CREATE INDEX idx_purchase_events_token ON public.purchase_events(purchase_token);
CREATE INDEX idx_purchase_events_created_at ON public.purchase_events(created_at DESC);

-- Trial starts (prevents trial abuse — one trial per user/device)
CREATE TABLE public.trial_starts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  device_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(device_id)
);

CREATE INDEX idx_trial_starts_device ON public.trial_starts(device_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_starts ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users read own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can read their own trial record
CREATE POLICY "Users read own trial"
  ON public.trial_starts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- purchase_events: no client access (server-only via service role)

-- Helper function: check if user has active access (trial or paid)
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status = 'trial' AND trial_ends_at > now())
        OR (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
      )
  );
$$;

-- updated_at trigger
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default pricing into app_settings
INSERT INTO public.app_settings (key, category, value, description)
VALUES (
  'billing_plans',
  'billing',
  '{
    "trial_days": 7,
    "currency": "USD",
    "plans": {
      "monthly":  { "product_id": "obgyn_monthly",  "price": 7.99,   "label_en": "Monthly",  "label_ar": "شهري" },
      "yearly":   { "product_id": "obgyn_yearly",   "price": 49.99,  "label_en": "Yearly",   "label_ar": "سنوي", "savings": "48%" },
      "lifetime": { "product_id": "obgyn_lifetime", "price": 119.99, "label_en": "Lifetime", "label_ar": "مدى الحياة" }
    },
    "free_features": ["case_of_the_day", "ai_assistant"],
    "locked_features": ["mcq_bank", "exams", "scenarios", "surgery_library", "tools", "calculators", "daily_mcq"]
  }'::jsonb,
  'Subscription pricing and feature gating'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();