import type { PantryCategory } from '../../types/database'

// Default header background per category
export const CATEGORY_BG: Record<PantryCategory, string> = {
  fresh_produce:     'bg-green-50 dark:bg-green-900/20',
  dairy_eggs:        'bg-blue-50 dark:bg-blue-900/20',
  protein:           'bg-red-50 dark:bg-red-900/20',
  grains_legumes:    'bg-amber-50 dark:bg-amber-900/20',
  spices_herbs:      'bg-orange-50 dark:bg-orange-900/20',
  condiments_sauces: 'bg-yellow-50 dark:bg-yellow-900/20',
  oils_fats:         'bg-yellow-50 dark:bg-yellow-900/20',
  frozen:            'bg-cyan-50 dark:bg-cyan-900/20',
  canned:            'bg-stone-100 dark:bg-stone-800/30',
  dry_shelf:         'bg-amber-50 dark:bg-amber-900/20',
  baking:            'bg-pink-50 dark:bg-pink-900/20',
  snacks:            'bg-purple-50 dark:bg-purple-900/20',
  beverages:         'bg-teal-50 dark:bg-teal-900/20',
  dips:              'bg-lime-50 dark:bg-lime-900/20',
  other:             'bg-stone-100 dark:bg-stone-800/30',
}

// Hover — one shade darker than default
export const CATEGORY_HOVER: Record<PantryCategory, string> = {
  fresh_produce:     'hover:bg-green-100 dark:hover:bg-green-900/40',
  dairy_eggs:        'hover:bg-blue-100 dark:hover:bg-blue-900/40',
  protein:           'hover:bg-red-100 dark:hover:bg-red-900/40',
  grains_legumes:    'hover:bg-amber-100 dark:hover:bg-amber-900/40',
  spices_herbs:      'hover:bg-orange-100 dark:hover:bg-orange-900/40',
  condiments_sauces: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
  oils_fats:         'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
  frozen:            'hover:bg-cyan-100 dark:hover:bg-cyan-900/40',
  canned:            'hover:bg-stone-200 dark:hover:bg-stone-700/50',
  dry_shelf:         'hover:bg-amber-100 dark:hover:bg-amber-900/40',
  baking:            'hover:bg-pink-100 dark:hover:bg-pink-900/40',
  snacks:            'hover:bg-purple-100 dark:hover:bg-purple-900/40',
  beverages:         'hover:bg-teal-100 dark:hover:bg-teal-900/40',
  dips:              'hover:bg-lime-100 dark:hover:bg-lime-900/40',
  other:             'hover:bg-stone-200 dark:hover:bg-stone-700/50',
}

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
