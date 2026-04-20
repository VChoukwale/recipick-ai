import { useState } from 'react'
import type { PantryItem, PantryCategory } from '../../types/database'
import { CATEGORY_META, CATEGORY_ORDER } from './categoryMeta'
import QuantityInput from './QuantityInput'

interface Props {
  item: PantryItem
  onSave: (id: string, fields: {
    name: string
    category: PantryCategory
    secondary_categories: PantryCategory[]
    store_name: string | null
    quantity: string | null
  }) => void
  onClose: () => void
}

export default function EditItemSheet({ item, onSave, onClose }: Props) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState<PantryCategory>(item.category)
  const [secondaryCategories, setSecondaryCategories] = useState<PantryCategory[]>(
    item.secondary_categories ?? []
  )
  const [store, setStore] = useState(item.store_name ?? '')
  const [quantity, setQuantity] = useState(item.quantity ?? '')

  function toggleSecondary(cat: PantryCategory) {
    setSecondaryCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(item.id, {
      name: name.trim(),
      category,
      secondary_categories: secondaryCategories.filter(c => c !== category),
      store_name: store.trim() || null,
      quantity: quantity.trim() || null,
    })
    onClose()
  }

  const secondaryOptions = CATEGORY_ORDER.filter(c => c !== category)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed bottom-16 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 rounded-t-3xl shadow-2xl max-w-lg mx-auto animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-4" />

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-800 text-lg text-stone-800 dark:text-stone-100">
              Edit item
            </h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Item name"
              className="input-field"
            />

            {/* Primary category */}
            <div>
              <label className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-1.5 block">
                Primary category
              </label>
              <select
                value={category}
                onChange={e => {
                  const val = e.target.value as PantryCategory
                  setCategory(val)
                  setSecondaryCategories(prev => prev.filter(c => c !== val))
                }}
                className="input-field"
              >
                {CATEGORY_ORDER.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary categories */}
            <div>
              <label className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-1.5 block">
                Also appears in <span className="font-400 text-stone-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {secondaryOptions.map(cat => {
                  const selected = secondaryCategories.includes(cat)
                  return (
                    <button key={cat} type="button" onClick={() => toggleSecondary(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-display font-600 transition-all duration-150 ${
                        selected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Store */}
            <input value={store} onChange={e => setStore(e.target.value)}
              placeholder="Store (e.g. Trader Joe's, Whole Foods)" className="input-field" />

            {/* Quantity + unit */}
            <div>
              <label className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-1.5 block">
                Quantity
              </label>
              <QuantityInput value={quantity} onChange={setQuantity} />
            </div>

            <button type="submit" disabled={!name.trim()}
              className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
              Save changes
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
