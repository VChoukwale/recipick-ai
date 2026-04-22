CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  reaction TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own feedback
CREATE POLICY "Users insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
