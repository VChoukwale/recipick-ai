import { useState } from 'react'
import type { PantryItem } from '../../types/database'

interface Props {
  item: PantryItem
  onToggleAvailable: (id: string, value: boolean) => void
  onToggleStar: (id: string) => void
  onEdit: (item: PantryItem) => void
  onDelete: (id: string) => void
}

export default function PantryItemRow({ item, onToggleAvailable, onToggleStar, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 group animate-fade-in">
      {/* Availability checkbox */}
      <button
        onClick={() => onToggleAvailable(item.id, !item.is_available)}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          item.is_available
            ? 'bg-sage-400 border-sage-400'
            : 'border-stone-300 dark:border-stone-600'
        }`}
      >
        {item.is_available && <span className="text-white text-xs font-bold">✓</span>}
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className={`font-body text-base leading-tight truncate ${
          item.is_available
            ? 'text-stone-800 dark:text-stone-100'
            : 'text-stone-400 dark:text-stone-500 line-through'
        }`}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.store_name && (
            <span className="text-xs font-display font-600 px-2 py-0.5 rounded-full bg-cream-200 dark:bg-charcoal-800 text-stone-500 dark:text-stone-400">
              {item.store_name}
            </span>
          )}
          {item.quantity && (
            <span className="text-xs text-stone-400 dark:text-stone-500 font-body">{item.quantity}</span>
          )}
          {!item.store_name && !item.quantity && (
            <button
              onClick={() => onEdit(item)}
              className="text-xs text-brand-400 hover:text-brand-600 font-display font-600 transition-colors"
            >
              + add store / qty
            </button>
          )}
        </div>
      </div>

      {/* Star ingredient */}
      <button
        onClick={() => onToggleStar(item.id)}
        className={`flex-shrink-0 text-lg transition-all duration-200 ${
          item.is_star_ingredient ? 'animate-glow-gold' : 'opacity-30 hover:opacity-70'
        }`}
      >
        {item.is_star_ingredient ? '⭐' : '☆'}
      </button>

      {/* Edit / Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onDelete(item.id)}
            className="text-[11px] px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-display font-600">
            Remove
          </button>
          <button onClick={() => setConfirmDelete(false)}
            className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 dark:bg-charcoal-800 text-stone-500 font-display font-600">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button onClick={() => onEdit(item)}
            className="text-[11px] px-2 py-1 rounded-lg bg-cream-200 dark:bg-charcoal-700 text-stone-500 dark:text-stone-400 font-display font-600 hover:bg-cream-300 transition-colors">
            Edit
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="text-stone-300 hover:text-red-400 text-sm transition-colors px-1">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
