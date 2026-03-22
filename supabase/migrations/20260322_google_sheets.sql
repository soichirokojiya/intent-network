ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_sheets_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_sheets_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_sheets_connected boolean DEFAULT false;
