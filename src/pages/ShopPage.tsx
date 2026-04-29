import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CookingSpinner from '../components/ui/CookingSpinner'

function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

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
  category: string | null
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
  const [fetchError, setFetchError] = useState(false)
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
    const { data, error } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('ShopPage fetchItems failed:', error)
      setFetchError(true)
      setLoading(false)
      return
    }
    setFetchError(false)
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
    try {
      const { data, error } = await supabase
        .from('grocery_list')
        .insert({ user_id: user!.id, name, is_checked: false })
        .select()
        .single()
      if (error) throw error
      if (data) setItems(prev => [...prev, data as GroceryItem])
      setNewItem('')
      inputRef.current?.focus()
    } catch {
      showToast('Could not add item. Check your connection.')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newVal = !item.is_checked
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: newVal } : i))
    const { error: toggleErr } = await supabase.from('grocery_list').update({ is_checked: newVal }).eq('id', id)
    if (toggleErr) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: item.is_checked } : i))
      showToast('Could not update item. Check your connection.')
      return
    }

    if (newVal) {
      try {
        const { data: existingData } = await supabase
          .from('pantry_items')
          .select('id, category')
          .eq('user_id', user!.id)
          .ilike('name', item.name)
          .maybeSingle()

        const existing = existingData as { id: string; category: string } | null
        // Priority: grocery item's saved category → existing pantry item's category → AI fallback
        const resolvedCategory = item.category ?? existing?.category ?? 'other'

        if (!existing) {
          const { data: newPantryItem } = await supabase.from('pantry_items').insert({
            user_id: user!.id,
            name: item.name,
            category: resolvedCategory,
            is_available: true,
            is_favorite: false,
            is_star_ingredient: false,
            ai_tags: [],
          }).select().single()

          showToast(`✓ ${item.name} added to pantry`)

          // Only call AI if we had no category info — avoids unnecessary edge function calls
          if (newPantryItem && resolvedCategory === 'other') {
            supabase.functions.invoke('ai-categorize', { body: { item_name: item.name } }).then(({ data }) => {
              if (data?.category) {
                supabase.from('pantry_items')
                  .update({ category: data.category, ai_tags: data.ai_tags ?? [] })
                  .eq('id', (newPantryItem as { id: string }).id)
              }
            })
          }
        } else {
          await supabase.from('pantry_items').update({ is_available: true }).eq('id', existing.id)
          showToast(`✓ ${item.name} marked available in pantry`)
        }
      } catch {
        showToast(`Checked off — pantry update failed`)
      }
    }
  }

  async function handleDelete(id: string) {
    const snapshot = items
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('grocery_list').delete().eq('id', id)
    if (error) {
      console.error('ShopPage handleDelete failed:', error)
      setItems(snapshot)
      showToast('Could not remove item. Try again.')
    }
  }

  async function handleClearChecked() {
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id)
    if (!checkedIds.length) return
    const snapshot = items
    setItems(prev => prev.filter(i => !i.is_checked))
    const { error } = await supabase.from('grocery_list').delete().in('id', checkedIds)
    if (error) {
      console.error('ShopPage handleClearChecked failed:', error)
      setItems(snapshot)
      showToast('Could not clear items. Try again.')
    }
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
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
            <p className="text-sm font-body text-stone-500 dark:text-stone-400">Couldn't load your grocery list. Try refreshing.</p>
            <button onClick={fetchItems} className="btn-primary mt-1">Refresh</button>
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
          {/* Input with mic inside on the left */}
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0 rounded-2xl px-3 py-2 transition-all"
            style={{
              background: 'var(--s0)',
              border: listening ? '1.5px solid #ef4444' : '1.5px solid var(--bdr-m)',
            }}
          >
            <button
              type="button"
              onClick={handleVoice}
              className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                listening ? 'animate-pulse' : ''
              }`}
              style={{ color: listening ? '#ef4444' : '#E8713A' }}
              title={listening ? 'Stop listening' : 'Voice input'}
            >
              <MicIcon size={16} />
            </button>
            <input
              ref={inputRef}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder={listening ? 'Listening…' : 'Add an item…'}
              className="flex-1 min-w-0 bg-transparent text-sm font-body outline-none"
              style={{ color: 'var(--t1)' }}
              disabled={adding}
            />
          </div>
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
