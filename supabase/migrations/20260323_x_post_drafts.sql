-- X post drafts table for Kai's tweet proposals
CREATE TABLE IF NOT EXISTS public.x_post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  agent_id text NOT NULL DEFAULT 'kai',
  agent_name text NOT NULL DEFAULT 'Kai',
  text text NOT NULL,
  source text DEFAULT 'manual',
  status text DEFAULT 'pending',
  rejection_reason text,
  tweet_id text,
  engagement jsonb DEFAULT '{}',
  scheduled_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.x_post_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON public.x_post_drafts
  FOR SELECT USING (true);

CREATE POLICY "Service can insert drafts" ON public.x_post_drafts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update drafts" ON public.x_post_drafts
  FOR UPDATE USING (true);

-- Index
CREATE INDEX idx_x_post_drafts_device ON public.x_post_drafts(device_id, status);
CREATE INDEX idx_x_post_drafts_status ON public.x_post_drafts(status, created_at);
