import { useState, useEffect, useRef } from 'react'
import type { PantryItem, PantryCategory } from '../../types/database'
import { CATEGORY_META, CATEGORY_ORDER } from './categoryMeta'
import QuantityInput from './QuantityInput'
import StoreInput from './StoreInput'

interface Props {
  onAdd: (item: {
    name: string
    category: PantryCategory
    secondary_categories: PantryCategory[]
    store_name: string
    quantity: string
  }) => void
  onClose: () => void
  suggestions: string[]
  existingItems: PantryItem[]
}

export default function AddItemSheet({ onAdd, onClose, suggestions, existingItems }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PantryCategory>('other')
  const [secondaryCategories, setSecondaryCategories] = useState<PantryCategory[]>([])
  const [store, setStore] = useState('')
  const [quantity, setQuantity] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState<PantryItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (name.length < 2) {
      setFilteredSuggestions([])
      setShowSuggestions(false)
      setDuplicateItem(null)
      return
    }
    const lower = name.toLowerCase().trim()

    // Check for duplicate
    const found = existingItems.find(i => i.name.toLowerCase() === lower)
    setDuplicateItem(found ?? null)

    // Autocomplete suggestions
    const matches = suggestions.filter(s => s.toLowerCase().includes(lower)).slice(0, 6)
    setFilteredSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  }, [name, suggestions, existingItems])

  function toggleSecondary(cat: PantryCategory) {
    setSecondaryCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      category,
      secondary_categories: secondaryCategories.filter(c => c !== category),
      store_name: store.trim(),
      quantity: quantity.trim(),
    })
    setName(''); setStore(''); setQuantity('')
    setCategory('other'); setSecondaryCategories([])
    setDuplicateItem(null)
    inputRef.current?.focus()
  }

  const secondaryOptions = CATEGORY_ORDER.filter(c => c !== category)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed bottom-16 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 rounded-t-3xl shadow-2xl max-w-lg mx-auto animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-4" />

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-800 text-lg text-stone-800 dark:text-stone-100">Add to pantry</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name input */}
            <div className="relative">
              <input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => filteredSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Item name (e.g. paneer, rice, olive oil)"
                className="input-field"
                autoComplete="off"
              />
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-charcoal-800 rounded-2xl shadow-lg border border-cream-200 dark:border-charcoal-700 z-10 overflow-hidden">
                  {filteredSuggestions.map(s => (
                    <button key={s} type="button"
                      onClick={() => { setName(s); setShowSuggestions(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm font-body text-stone-700 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate warning */}
            {duplicateItem && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 animate-fade-in">
                <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-display font-700 text-amber-700 dark:text-amber-300">
                    Already in your pantry!
                  </p>
                  <p className="text-xs font-body text-amber-600 dark:text-amber-400 mt-0.5">
                    "{duplicateItem.name}" is already added
                    {duplicateItem.store_name ? ` from ${duplicateItem.store_name}` : ''}.
                    You can still add it with different details.
                  </p>
                </div>
              </div>
            )}

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
                Also appears in <span className="font-400 text-stone-400">(optional — e.g. paneer = dairy + protein)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {secondaryOptions.map(cat => {
                  const selected = secondaryCategories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleSecondary(cat)}
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
            <div>
              <label className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-1.5 block">
                Store <span className="font-400 text-stone-400">(optional)</span>
              </label>
              <StoreInput value={store} onChange={setStore} />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-1.5 block">
                Quantity <span className="font-400 text-stone-400">(optional)</span>
              </label>
              <QuantityInput value={quantity} onChange={setQuantity} />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {duplicateItem ? '+ Add anyway' : 'Add to pantry'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
