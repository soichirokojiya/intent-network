-- Google Drive
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_drive_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_drive_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_drive_connected boolean DEFAULT false;

-- Gmail
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gmail_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gmail_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gmail_connected boolean DEFAULT false;

-- Notion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notion_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notion_connected boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notion_workspace_name text;

-- X (Twitter)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_connected boolean DEFAULT false;

-- freee
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS freee_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS freee_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS freee_connected boolean DEFAULT false;

-- Slack
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slack_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slack_connected boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slack_team_name text;

-- LINE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_access_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_refresh_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_connected boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS line_display_name text;
