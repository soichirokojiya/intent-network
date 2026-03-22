CREATE TABLE IF NOT EXISTS public.automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'email_match'
  trigger_config jsonb NOT NULL DEFAULT '{}', -- { "query": "from:xxx subject:売上" }
  action_type text NOT NULL, -- 'sheets_write', 'sheets_append'
  action_config jsonb NOT NULL DEFAULT '{}', -- { "spreadsheetId": "xxx", "sheetName": "Sheet1", "extractPrompt": "..." }
  agent_id text, -- which agent executes this
  enabled boolean DEFAULT true,
  last_run_at timestamptz,
  last_email_id text, -- track last processed email to avoid duplicates
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
