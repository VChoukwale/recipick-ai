import { useState } from 'react'
import type { PantryItem, PantryCategory } from '../../types/database'
import { CATEGORY_META, CATEGORY_ACCENT, CATEGORY_BG, CATEGORY_HOVER } from './categoryMeta'
import PantryItemRow from './PantryItemRow'

interface Props {
  category: PantryCategory
  items: PantryItem[]
  onToggleAvailable: (id: string, value: boolean) => void
  onToggleStar: (id: string) => void
  onEdit: (item: PantryItem) => void
  onDelete: (id: string) => void
  dietConflictCount?: number
  dietLabel?: string
  conflictItemIds?: Set<string>
  allergenItemIds?: Set<string>
  groceryNames?: Set<string>
}

export default function PantrySection({ category, items, onToggleAvailable, onToggleStar, onEdit, onDelete, dietConflictCount = 0, dietLabel = '', conflictItemIds, allergenItemIds, groceryNames }: Props) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_META[category]
  const accent = CATEGORY_ACCENT[category]
  const bg = CATEGORY_BG[category]
  const hover = CATEGORY_HOVER[category]
  const availableCount = items.filter(i => i.is_available).length

  return (
    <div id={`pantry-${category}`} data-category={category} className={`bg-white dark:bg-charcoal-800 rounded-2xl overflow-hidden shadow-md border-l-4 ${accent} border-t border-r border-b border-cream-200 dark:border-t-charcoal-700 dark:border-r-charcoal-700 dark:border-b-charcoal-700 transition-shadow hover:shadow-lg`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-150 cursor-pointer ${bg} ${hover}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{meta.emoji}</span>
          <span className="font-display font-700 text-base text-stone-800 dark:text-stone-100">{meta.label}</span>
          <span className="text-xs font-body px-2 py-0.5 rounded-full bg-cream-100 dark:bg-charcoal-700 text-stone-400 dark:text-stone-500">
            {availableCount}/{items.length}
          </span>
          {dietConflictCount > 0 && (
            <span className="text-[10px] font-display font-700 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              ⚠️ {dietConflictCount} not {dietLabel}
            </span>
          )}
        </div>
        <span className={`text-stone-400 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Items */}
      {open && (
        <div className="px-4 pb-2 divide-y divide-cream-100 dark:divide-charcoal-700/50">
          {items.map(item => (
            <PantryItemRow
              key={item.id}
              item={item}
              onToggleAvailable={onToggleAvailable}
              onToggleStar={onToggleStar}
              onEdit={onEdit}
              onDelete={onDelete}
              isConflict={conflictItemIds?.has(item.id) ?? false}
              isAllergen={allergenItemIds?.has(item.id) ?? false}
              isOnGroceryList={groceryNames?.has(item.name.toLowerCase()) ?? false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
