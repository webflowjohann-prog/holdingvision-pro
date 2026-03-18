-- ═══ HoldingVision Pro — user_brand table ═══
-- Stores white-label brand identity per user (logo, colors, name)
-- Run this in the Supabase SQL Editor for project: stinothaqbjhnfrffvti

CREATE TABLE IF NOT EXISTS user_brand (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_brand_user_unique UNIQUE (user_id)
);

-- Row Level Security: each user can only access their own brand
ALTER TABLE user_brand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own brand"
  ON user_brand FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand"
  ON user_brand FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand"
  ON user_brand FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand"
  ON user_brand FOR DELETE
  USING (auth.uid() = user_id);
