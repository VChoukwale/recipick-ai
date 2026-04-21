import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CookingSpinner from '../components/ui/CookingSpinner'

interface GroceryItem {
  id: string
  name: string
  store: string | null
  is_checked: boolean
  created_at: string
}

function GroceryRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-charcoal-800 rounded-2xl border border-stone-200 dark:border-charcoal-700 transition-opacity ${item.is_checked ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.is_checked
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-stone-300 dark:border-charcoal-500'
        }`}
      >
        {item.is_checked && <span className="text-xs">✓</span>}
      </button>
      <span className={`flex-1 font-body text-sm text-stone-700 dark:text-stone-300 ${item.is_checked ? 'line-through text-stone-400 dark:text-stone-500' : ''}`}>
        {item.name}
      </span>
      {item.store && (
        <span className="text-xs font-body px-2 py-0.5 rounded-full bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400">
          {item.store}
        </span>
      )}
      <button
        onClick={onDelete}
        className="flex-shrink-0 text-stone-300 dark:text-stone-600 hover:text-red-400 transition-colors text-sm"
      >
        ✕
      </button>
    </div>
  )
}

export default function ShopPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    fetchItems()
  }, [user])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
    setItems((data as GroceryItem[]) ?? [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newItem.trim()
    if (!name) return
    setAdding(true)
    const { data } = await supabase
      .from('grocery_list')
      .insert({ user_id: user!.id, name, is_checked: false })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data as GroceryItem])
    setNewItem('')
    setAdding(false)
    inputRef.current?.focus()
  }

  async function handleToggle(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newVal = !item.is_checked
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: newVal } : i))
    await supabase.from('grocery_list').update({ is_checked: newVal }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('grocery_list').delete().eq('id', id)
  }

  async function handleClearChecked() {
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id)
    if (!checkedIds.length) return
    setItems(prev => prev.filter(i => !i.is_checked))
    await supabase.from('grocery_list').delete().in('id', checkedIds)
  }

  const unchecked = items.filter(i => !i.is_checked)
  const checked = items.filter(i => i.is_checked)

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-800 text-2xl text-stone-800 dark:text-stone-100">Grocery Run</h1>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500 mt-0.5">
              {unchecked.length > 0 ? `${unchecked.length} item${unchecked.length !== 1 ? 's' : ''} to get` : checked.length > 0 ? 'All done!' : 'Nothing on your list yet'}
            </p>
          </div>
          {checked.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="text-xs font-display font-700 px-3 py-1.5 rounded-full bg-white dark:bg-charcoal-800 border border-stone-200 dark:border-charcoal-700 text-stone-400 dark:text-stone-500 hover:text-red-400 hover:border-red-200 transition-colors"
            >
              Clear {checked.length} done
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <CookingSpinner size="md" label="Loading your list…" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
            <span className="text-5xl">🛒</span>
            <h3 className="font-display font-700 text-stone-700 dark:text-stone-300">Your list is empty</h3>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">
              Add items below, or tap <strong>Add to list</strong> on any recipe's missing ingredients.
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {unchecked.map(item => (
              <GroceryRow key={item.id} item={item} onToggle={() => handleToggle(item.id)} onDelete={() => handleDelete(item.id)} />
            ))}

            {checked.length > 0 && unchecked.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-cream-300 dark:bg-charcoal-700" />
                <span className="text-xs font-display font-600 text-stone-400 dark:text-stone-500">In cart</span>
                <div className="flex-1 h-px bg-cream-300 dark:bg-charcoal-700" />
              </div>
            )}

            {checked.map(item => (
              <GroceryRow key={item.id} item={item} onToggle={() => handleToggle(item.id)} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky add form */}
      <div className="absolute bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-3 pt-2 backdrop-blur-md" style={{ background: 'var(--s3)', borderTop: '1px solid var(--bdr-s)', boxShadow: 'var(--shd-up)' }}>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Add an item…"
            className="input-field flex-1"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newItem.trim()}
            className="btn-primary px-4 py-2.5 text-sm font-display font-700 rounded-2xl disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
