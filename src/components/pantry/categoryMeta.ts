import type { PantryCategory } from '../../types/database'

// Tailwind border-l color class per category
export const CATEGORY_ACCENT: Record<PantryCategory, string> = {
  fresh_produce:     'border-l-green-400',
  dairy_eggs:        'border-l-blue-300',
  protein:           'border-l-red-400',
  grains_legumes:    'border-l-amber-400',
  spices_herbs:      'border-l-orange-400',
  condiments_sauces: 'border-l-yellow-400',
  oils_fats:         'border-l-yellow-300',
  frozen:            'border-l-cyan-400',
  canned:            'border-l-stone-400',
  dry_shelf:         'border-l-amber-600',
  baking:            'border-l-pink-400',
  snacks:            'border-l-purple-400',
  beverages:         'border-l-teal-400',
  dips:              'border-l-lime-400',
  other:             'border-l-stone-300',
}

export const CATEGORY_META: Record<PantryCategory, { label: string; emoji: string }> = {
  fresh_produce:     { label: 'Fresh Produce',       emoji: '🥬' },
  dairy_eggs:        { label: 'Dairy & Eggs',         emoji: '🥛' },
  protein:           { label: 'Protein',              emoji: '💪' },
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
  'fresh_produce', 'dairy_eggs', 'protein', 'grains_legumes', 'spices_herbs',
  'condiments_sauces', 'oils_fats', 'frozen', 'canned',
  'dry_shelf', 'baking', 'snacks', 'beverages', 'dips', 'other',
]
