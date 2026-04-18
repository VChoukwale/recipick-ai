-- ============================================================
-- recipick.ai — initial schema
-- Run this in Supabase SQL editor (or use supabase db push)
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID REFERENCES auth.users PRIMARY KEY,
  display_name         TEXT,
  dietary_preference   TEXT CHECK (dietary_preference IN ('vegetarian', 'vegetarian_with_eggs', 'vegan')) DEFAULT 'vegetarian',
  skill_level          TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  preferred_cuisines   TEXT[] DEFAULT '{}',
  day_status           TEXT CHECK (day_status IN ('home_all_day', 'busy_until', 'late_night', 'quick_only')) DEFAULT 'home_all_day',
  busy_until_time      TIME,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── pantry_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  category          TEXT CHECK (category IN (
    'fresh_produce', 'dairy_eggs', 'grains_legumes', 'spices_herbs',
    'condiments_sauces', 'frozen', 'snacks', 'beverages',
    'dry_shelf', 'oils_fats', 'baking', 'dips', 'canned', 'other'
  )) NOT NULL,
  subcategory       TEXT,
  store_name        TEXT,
  product_url       TEXT,
  product_image_url TEXT,
  manual_image_url  TEXT,
  is_available      BOOLEAN DEFAULT TRUE,
  is_favorite       BOOLEAN DEFAULT FALSE,
  is_star_ingredient BOOLEAN DEFAULT FALSE,
  quantity          TEXT,
  ai_tags           TEXT[] DEFAULT '{}',
  added_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── saved_recipes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_recipes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  cuisine_type     TEXT,
  region_detail    TEXT,
  ingredients      JSONB NOT NULL DEFAULT '[]',
  instructions     TEXT[] NOT NULL DEFAULT '{}',
  difficulty       TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  time_minutes     INTEGER,
  match_percentage INTEGER,
  is_favorite      BOOLEAN DEFAULT FALSE,
  source           TEXT CHECK (source IN ('ai_generated', 'web_import', 'manual')) DEFAULT 'ai_generated',
  source_url       TEXT,
  why_this         TEXT,
  substitutions    JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── grocery_list ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_list (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  category   TEXT,
  store_name TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  ai_tags    TEXT[] DEFAULT '{}',
  added_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── food_vocabulary ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_vocabulary (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word      TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, word)
);

-- ─── updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_pantry
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── auto-create profile on sign-up ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list   ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_vocabulary ENABLE ROW LEVEL SECURITY;

-- profiles: user can read/update only their own
CREATE POLICY "Own profile select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- pantry_items
CREATE POLICY "Own pantry select" ON pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own pantry insert" ON pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own pantry update" ON pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own pantry delete" ON pantry_items FOR DELETE USING (auth.uid() = user_id);

-- saved_recipes
CREATE POLICY "Own recipes select" ON saved_recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own recipes insert" ON saved_recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own recipes update" ON saved_recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own recipes delete" ON saved_recipes FOR DELETE USING (auth.uid() = user_id);

-- grocery_list
CREATE POLICY "Own grocery select" ON grocery_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own grocery insert" ON grocery_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own grocery update" ON grocery_list FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own grocery delete" ON grocery_list FOR DELETE USING (auth.uid() = user_id);

-- food_vocabulary
CREATE POLICY "Own vocab select" ON food_vocabulary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own vocab insert" ON food_vocabulary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own vocab update" ON food_vocabulary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own vocab delete" ON food_vocabulary FOR DELETE USING (auth.uid() = user_id);
