-- Fix dietary_preference CHECK constraint to include non_vegetarian
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_dietary_preference_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_dietary_preference_check
  CHECK (dietary_preference IN ('vegetarian', 'vegetarian_with_eggs', 'vegan', 'non_vegetarian'));
