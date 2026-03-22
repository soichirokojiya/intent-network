CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.site_settings (key, value) VALUES ('signup_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
