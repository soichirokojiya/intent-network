CREATE TABLE IF NOT EXISTS public.churn_surveys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text,
  user_id text,
  email text,
  reason text,
  comment text,
  created_at timestamptz DEFAULT now()
);
