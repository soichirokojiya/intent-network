ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freee_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freee_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freee_connected boolean DEFAULT false;
