ALTER TABLE public.subscriptions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_purchase_token_key ON public.subscriptions (purchase_token) WHERE purchase_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique ON public.subscriptions (user_id) WHERE user_id IS NOT NULL;