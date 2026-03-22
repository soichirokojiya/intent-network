ALTER TABLE profiles ADD COLUMN IF NOT EXISTS square_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS square_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS square_connected boolean DEFAULT false;
