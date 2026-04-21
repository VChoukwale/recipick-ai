import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CookingSpinner from '../components/ui/CookingSpinner'

interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string
  start(): void; stop(): void
  onstart: (() => void) | null; onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null
}
declare global { interface Window { SpeechRecognition: new () => ISpeechRecognition; webkitSpeechRecognition: new () => ISpeechRecognition } }

interface GroceryItem {
  id: string
  name: string
  store_name: string | null
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
      {item.store_name && (
        <span className="text-xs font-body px-2 py-0.5 rounded-full bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400">
          {item.store_name}
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
  const [toast, setToast] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input is not supported in this browser. Try Chrome.'); return }
    if (listening) { recognitionRef.current?.stop(); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
    recognitionRef.current = rec
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => setNewItem(Array.from(e.results).map(r => r[0].transcript).join(''))
    rec.onend = () => {
      setListening(false); recognitionRef.current = null
      setNewItem(prev => { if (prev.trim()) setTimeout(() => inputRef.current?.closest('form')?.requestSubmit(), 100); return prev })
    }
    rec.onerror = () => { setListening(false); recognitionRef.current = null }
    rec.start()
  }, [listening])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

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
    const duplicate = items.find(i => i.name.toLowerCase() === name.toLowerCase())
    if (duplicate) {
      showToast(`"${name}" is already on your list`)
      return
    }
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

    if (newVal) {
      // Add to pantry
      const { data: existing } = await supabase
        .from('pantry_items')
        .select('id')
        .eq('user_id', user!.id)
        .ilike('name', item.name)
        .maybeSingle()

      if (!existing) {
        const { data: newPantryItem } = await supabase.from('pantry_items').insert({
          user_id: user!.id,
          name: item.name,
          category: 'other',
          is_available: true,
          is_favorite: false,
          is_star_ingredient: false,
          ai_tags: [],
        }).select().single()

        showToast(`✓ ${item.name} added to pantry`)

        // Async AI categorization
        if (newPantryItem) {
          supabase.functions.invoke('ai-categorize', { body: { item_name: item.name } }).then(({ data }) => {
            if (data?.category) {
              supabase.from('pantry_items')
                .update({ category: data.category, ai_tags: data.ai_tags ?? [] })
                .eq('id', (newPantryItem as { id: string }).id)
            }
          })
        }
      } else {
        // Already in pantry — just make sure it's available
        await supabase.from('pantry_items').update({ is_available: true }).eq('id', existing.id)
        showToast(`✓ ${item.name} marked available in pantry`)
      }
    }
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
      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-sm font-display font-600 text-white shadow-lg animate-pop"
             style={{ background: '#E8713A', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Sticky add form — fixed above nav, safe-area aware */}
      <div
        className="fixed left-0 right-0 max-w-lg mx-auto px-4 pb-3 pt-2 backdrop-blur-md z-40"
        style={{
          bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          background: 'var(--s3)',
          borderTop: '1px solid var(--bdr-s)',
          boxShadow: 'var(--shd-up)',
        }}
      >
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Add an item…"
            className="input-field flex-1 min-w-0"
            style={{ width: 'auto' }}
            disabled={adding}
          />
          <button
            type="button"
            onClick={handleVoice}
            className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              listening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-white dark:bg-charcoal-700 border border-stone-200 dark:border-charcoal-600 text-stone-400 dark:text-stone-400 hover:text-stone-600'
            }`}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            🎤
          </button>
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
