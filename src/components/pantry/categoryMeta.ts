import type { PantryCategory } from '../../types/database'

// Default header background per category
export const CATEGORY_BG: Record<PantryCategory, string> = {
  fresh_produce:     'bg-green-200 dark:bg-green-700/40',
  dairy_eggs:        'bg-blue-200 dark:bg-blue-700/40',
  protein:           'bg-red-200 dark:bg-red-700/40',
  grains_legumes:    'bg-amber-200 dark:bg-amber-700/40',
  spices_herbs:      'bg-orange-200 dark:bg-orange-700/40',
  condiments_sauces: 'bg-yellow-200 dark:bg-yellow-700/40',
  oils_fats:         'bg-lime-200 dark:bg-lime-700/40',
  frozen:            'bg-cyan-200 dark:bg-cyan-700/40',
  canned:            'bg-stone-300 dark:bg-stone-600/45',
  dry_shelf:         'bg-orange-100 dark:bg-orange-800/35',
  baking:            'bg-pink-200 dark:bg-pink-700/40',
  snacks:            'bg-purple-200 dark:bg-purple-700/40',
  beverages:         'bg-teal-200 dark:bg-teal-700/40',
  dips:              'bg-rose-200 dark:bg-rose-700/40',
  supplements:       'bg-indigo-200 dark:bg-indigo-700/40',
  other:             'bg-zinc-200 dark:bg-zinc-600/45',
}

// Hover — one shade darker than default
export const CATEGORY_HOVER: Record<PantryCategory, string> = {
  fresh_produce:     'hover:bg-green-300 dark:hover:bg-green-600/50',
  dairy_eggs:        'hover:bg-blue-300 dark:hover:bg-blue-600/50',
  protein:           'hover:bg-red-300 dark:hover:bg-red-600/50',
  grains_legumes:    'hover:bg-amber-300 dark:hover:bg-amber-600/50',
  spices_herbs:      'hover:bg-orange-300 dark:hover:bg-orange-600/50',
  condiments_sauces: 'hover:bg-yellow-300 dark:hover:bg-yellow-600/50',
  oils_fats:         'hover:bg-lime-300 dark:hover:bg-lime-600/50',
  frozen:            'hover:bg-cyan-300 dark:hover:bg-cyan-600/50',
  canned:            'hover:bg-stone-400 dark:hover:bg-stone-500/55',
  dry_shelf:         'hover:bg-orange-200 dark:hover:bg-orange-700/45',
  baking:            'hover:bg-pink-300 dark:hover:bg-pink-600/50',
  snacks:            'hover:bg-purple-300 dark:hover:bg-purple-600/50',
  beverages:         'hover:bg-teal-300 dark:hover:bg-teal-600/50',
  dips:              'hover:bg-rose-300 dark:hover:bg-rose-600/50',
  supplements:       'hover:bg-indigo-300 dark:hover:bg-indigo-600/50',
  other:             'hover:bg-zinc-300 dark:hover:bg-zinc-500/55',
}

// Tailwind border-l color class per category
export const CATEGORY_ACCENT: Record<PantryCategory, string> = {
  fresh_produce:     'border-l-green-500',
  dairy_eggs:        'border-l-blue-400',
  protein:           'border-l-red-500',
  grains_legumes:    'border-l-amber-500',
  spices_herbs:      'border-l-orange-500',
  condiments_sauces: 'border-l-yellow-500',
  oils_fats:         'border-l-lime-500',
  frozen:            'border-l-cyan-500',
  canned:            'border-l-stone-500',
  dry_shelf:         'border-l-orange-300',
  baking:            'border-l-pink-500',
  snacks:            'border-l-purple-500',
  beverages:         'border-l-teal-500',
  dips:              'border-l-rose-500',
  supplements:       'border-l-indigo-500',
  other:             'border-l-zinc-400',
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
  supplements:       { label: 'Supplements',          emoji: '🌿' },
  other:             { label: 'Other',                emoji: '🗂️' },
}

export const CATEGORY_ORDER: PantryCategory[] = [
  'fresh_produce', 'dairy_eggs', 'protein', 'grains_legumes', 'spices_herbs',
  'condiments_sauces', 'oils_fats', 'frozen', 'canned',
  'dry_shelf', 'baking', 'snacks', 'beverages', 'dips', 'supplements', 'other',
]
