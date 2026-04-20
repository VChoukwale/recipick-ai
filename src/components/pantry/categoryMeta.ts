import type { PantryCategory } from '../../types/database'

export const CATEGORY_META: Record<PantryCategory, { label: string; emoji: string }> = {
  fresh_produce:     { label: 'Fresh Produce',       emoji: '🥬' },
  dairy_eggs:        { label: 'Dairy & Eggs',         emoji: '🥛' },
  grains_legumes:    { label: 'Grains & Legumes',     emoji: '🌾' },
  spices_herbs:      { label: 'Spices & Herbs',       emoji: '🌶️' },
  condiments_sauces: { label: 'Condiments & Sauces',  emoji: '🫙' },
  oils_fats:         { label: 'Oils & Fats',          emoji: '🫒' },
  frozen:            { label: 'Frozen',               emoji: '🧊' },
  canned:            { label: 'Canned Goods',         emoji: '🥫' },
  dry_shelf:         { label: 'Dry & Shelf',          emoji: '📦' },
  baking:            { label: 'Baking',               emoji: '🧁' },
  snacks:            { label: 'Snacks',               emoji: '🍿' },
  beverages:         { label: 'Beverages',            emoji: '☕' },
  dips:              { label: 'Dips & Spreads',       emoji: '🥙' },
  other:             { label: 'Other',                emoji: '🗂️' },
}

export const CATEGORY_ORDER: PantryCategory[] = [
  'fresh_produce', 'dairy_eggs', 'grains_legumes', 'spices_herbs',
  'condiments_sauces', 'oils_fats', 'frozen', 'canned',
  'dry_shelf', 'baking', 'snacks', 'beverages', 'dips', 'other',
]
