-- Add X OAuth token columns to owner_agents for per-agent X account linking
ALTER TABLE public.owner_agents ADD COLUMN IF NOT EXISTS x_access_token text;
ALTER TABLE public.owner_agents ADD COLUMN IF NOT EXISTS x_refresh_token text;
ALTER TABLE public.owner_agents ADD COLUMN IF NOT EXISTS x_username text;
