ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chatwork_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chatwork_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chatwork_connected boolean DEFAULT false;
