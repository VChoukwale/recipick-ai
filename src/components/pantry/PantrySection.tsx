import { useState } from 'react'
import type { PantryItem, PantryCategory } from '../../types/database'
import { CATEGORY_META } from './categoryMeta'
import PantryItemRow from './PantryItemRow'

interface Props {
  category: PantryCategory
  items: PantryItem[]
  onToggleAvailable: (id: string, value: boolean) => void
  onToggleStar: (id: string) => void
  onDelete: (id: string) => void
}

export default function PantrySection({ category, items, onToggleAvailable, onToggleStar, onDelete }: Props) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_META[category]
  const availableCount = items.filter(i => i.is_available).length

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-2xl overflow-hidden shadow-sm border border-cream-200 dark:border-charcoal-800">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream-50 dark:hover:bg-charcoal-700 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.emoji}</span>
          <span className="font-display font-700 text-sm text-stone-800 dark:text-stone-100">{meta.label}</span>
          <span className="text-xs font-body text-stone-400 dark:text-stone-500">
            {availableCount}/{items.length}
          </span>
        </div>
        <span className={`text-stone-400 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Items */}
      {open && (
        <div className="px-4 pb-2 divide-y divide-cream-100 dark:divide-charcoal-700">
          {items.map(item => (
            <PantryItemRow
              key={item.id}
              item={item}
              onToggleAvailable={onToggleAvailable}
              onToggleStar={onToggleStar}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
