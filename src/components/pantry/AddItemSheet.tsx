import { useState, useEffect, useRef } from 'react'
import type { PantryCategory } from '../../types/database'
import { CATEGORY_META, CATEGORY_ORDER } from './categoryMeta'

interface Props {
  onAdd: (item: { name: string; category: PantryCategory; store_name: string; quantity: string }) => void
  onClose: () => void
  suggestions: string[]
}

export default function AddItemSheet({ onAdd, onClose, suggestions }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PantryCategory>('other')
  const [store, setStore] = useState('')
  const [quantity, setQuantity] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (name.length < 2) {
      setFilteredSuggestions([])
      setShowSuggestions(false)
      return
    }
    const lower = name.toLowerCase()
    const matches = suggestions.filter(s => s.toLowerCase().includes(lower)).slice(0, 6)
    setFilteredSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  }, [name, suggestions])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), category, store_name: store.trim(), quantity: quantity.trim() })
    setName('')
    setStore('')
    setQuantity('')
    setCategory('other')
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 rounded-t-3xl shadow-2xl max-w-lg mx-auto animate-slide-up">
        <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-4" />

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-800 text-lg text-stone-800 dark:text-stone-100">Add to pantry</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name with autocomplete */}
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
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setName(s); setShowSuggestions(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm font-body text-stone-700 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-charcoal-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value as PantryCategory)}
              className="input-field"
            >
              {CATEGORY_ORDER.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                </option>
              ))}
            </select>

            {/* Store + Quantity row */}
            <div className="flex gap-2">
              <input
                value={store}
                onChange={e => setStore(e.target.value)}
                placeholder="Store (optional)"
                className="input-field flex-1"
              />
              <input
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Qty (optional)"
                className="input-field w-28"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to pantry
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
