ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false;
