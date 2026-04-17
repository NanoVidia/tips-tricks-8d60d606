CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  repeat_pattern TEXT NOT NULL DEFAULT 'none' CHECK (repeat_pattern IN ('none','daily','weekly')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone (the app on user devices) can read active notifications to schedule them locally
CREATE POLICY "Public can read active notifications"
ON public.scheduled_notifications
FOR SELECT
USING (active = true);

-- Writes are blocked at the table level; only edge functions with the service role can write
-- (no INSERT/UPDATE/DELETE policies = no access for anon/authenticated)

CREATE TRIGGER update_scheduled_notifications_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_scheduled_notifications_active_time
ON public.scheduled_notifications (active, scheduled_at);