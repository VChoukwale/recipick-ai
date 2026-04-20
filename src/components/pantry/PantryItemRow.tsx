import { useState } from 'react'
import type { PantryItem } from '../../types/database'

interface Props {
  item: PantryItem
  onToggleAvailable: (id: string, value: boolean) => void
  onToggleStar: (id: string) => void
  onDelete: (id: string) => void
}

export default function PantryItemRow({ item, onToggleAvailable, onToggleStar, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 group animate-fade-in">
      {/* Availability checkbox */}
      <button
        onClick={() => onToggleAvailable(item.id, !item.is_available)}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          item.is_available
            ? 'bg-sage-400 border-sage-400 animate-pulse-green'
            : 'border-stone-300 dark:border-stone-600'
        }`}
        title={item.is_available ? 'Mark as unavailable' : 'Mark as available'}
      >
        {item.is_available && <span className="text-white text-xs font-bold">✓</span>}
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className={`font-body text-sm leading-tight truncate ${
          item.is_available
            ? 'text-stone-800 dark:text-stone-100'
            : 'text-stone-400 dark:text-stone-500 line-through'
        }`}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.store_name && (
            <span className="text-[10px] font-display font-600 px-1.5 py-0.5 rounded-full bg-cream-200 dark:bg-charcoal-800 text-stone-500 dark:text-stone-400">
              {item.store_name}
            </span>
          )}
          {item.quantity && (
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-body">{item.quantity}</span>
          )}
        </div>
      </div>

      {/* Star ingredient */}
      <button
        onClick={() => onToggleStar(item.id)}
        className={`flex-shrink-0 text-lg transition-all duration-200 ${
          item.is_star_ingredient ? 'animate-glow-gold' : 'opacity-30 hover:opacity-70'
        }`}
        title={item.is_star_ingredient ? 'Remove star ingredient' : 'Set as star ingredient'}
      >
        {item.is_star_ingredient ? '⭐' : '☆'}
      </button>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onDelete(item.id)}
            className="text-[11px] px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-display font-600"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 dark:bg-charcoal-800 text-stone-500 font-display font-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-80 text-stone-400 transition-opacity duration-150 text-sm"
          title="Delete item"
        >
          ✕
        </button>
      )}
    </div>
  )
}
