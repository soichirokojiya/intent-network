CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  trigger_type text NOT NULL, -- 'day3', 'day7', 'day30'
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);
