-- Add liked column to owner_chats for message reactions
ALTER TABLE owner_chats ADD COLUMN IF NOT EXISTS liked boolean DEFAULT false;
