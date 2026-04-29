-- Add allergies column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}';
