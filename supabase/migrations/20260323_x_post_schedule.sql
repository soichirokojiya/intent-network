-- X post schedule columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_post_schedule text DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_post_schedule_enabled boolean DEFAULT false;
