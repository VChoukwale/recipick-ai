-- Add fruits and nuts_seeds categories to pantry_items
-- Also normalises the constraint to include protein and supplements
-- which were added to the UI but missing from the DB constraint.
ALTER TABLE pantry_items DROP CONSTRAINT IF EXISTS pantry_items_category_check;
ALTER TABLE pantry_items ADD CONSTRAINT pantry_items_category_check
  CHECK (category IN (
    'fresh_produce', 'fruits', 'dairy_eggs', 'protein', 'nuts_seeds',
    'grains_legumes', 'spices_herbs', 'condiments_sauces', 'oils_fats',
    'frozen', 'canned', 'dry_shelf', 'baking', 'snacks', 'beverages',
    'dips', 'supplements', 'other'
  ));
