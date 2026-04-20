-- ─── grocery_list ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_list (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  name        TEXT NOT NULL,
  store       TEXT,
  is_checked  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own grocery list" ON grocery_list
  FOR ALL USING (auth.uid() = user_id);
