import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PantryItem, PantryCategory } from '../types/database'
import { CATEGORY_ORDER } from '../components/pantry/categoryMeta'
import PantrySection from '../components/pantry/PantrySection'
import AddItemSheet from '../components/pantry/AddItemSheet'
import EditItemSheet from '../components/pantry/EditItemSheet'

export default function PantryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [vocabulary, setVocabulary] = useState<string[]>([])

  // ── Load pantry items ──────────────────────────────────────
  useEffect(() => {
    if (!user) return
    fetchItems()
    fetchVocabulary()
  }, [user])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user!.id)
      .order('added_at', { ascending: false })
    setItems((data as PantryItem[]) ?? [])
    setLoading(false)
  }

  async function fetchVocabulary() {
    const { data } = await supabase
      .from('food_vocabulary')
      .select('word')
      .eq('user_id', user!.id)
      .order('frequency', { ascending: false })
      .limit(100)
    setVocabulary((data ?? []).map((r: { word: string }) => r.word))
  }

  // ── Add item ──────────────────────────────────────────────
  async function handleAdd(fields: { name: string; category: PantryCategory; secondary_categories: PantryCategory[]; store_name: string; quantity: string }) {
    const newItem = {
      user_id: user!.id,
      name: fields.name,
      category: fields.category,
      secondary_categories: fields.secondary_categories,
      store_name: fields.store_name || null,
      quantity: fields.quantity || null,
      is_available: true,
      is_favorite: false,
      is_star_ingredient: false,
      ai_tags: [],
    }

    const { data } = await supabase.from('pantry_items').insert(newItem).select().single()
    if (data) setItems(prev => [data as PantryItem, ...prev])

    // Learn vocabulary in background
    await upsertVocabulary(fields.name)

    // AI categorization in background (best-effort)
    if (data) triggerAICategorize(data as PantryItem, fields.store_name)
  }

  async function upsertVocabulary(word: string) {
    const lower = word.toLowerCase()
    const { data: existing } = await supabase
      .from('food_vocabulary')
      .select('id, frequency')
      .eq('user_id', user!.id)
      .eq('word', lower)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('food_vocabulary')
        .update({ frequency: (existing as { id: string; frequency: number }).frequency + 1, last_used: new Date().toISOString() })
        .eq('id', (existing as { id: string; frequency: number }).id)
    } else {
      await supabase.from('food_vocabulary').insert({ user_id: user!.id, word: lower, frequency: 1 })
      setVocabulary(prev => [lower, ...prev])
    }
  }

  async function triggerAICategorize(item: PantryItem, storeName: string) {
    try {
      const { data } = await supabase.functions.invoke('ai-categorize', {
        body: { item_name: item.name, store_name: storeName || undefined },
      })
      if (data?.category) {
        await supabase
          .from('pantry_items')
          .update({ category: data.category, subcategory: data.subcategory, ai_tags: data.ai_tags ?? [] })
          .eq('id', item.id)
        // Update local state silently
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data } : i))
      }
    } catch {
      // Silent fail — AI enrichment is optional
    }
  }

  // ── Toggle availability ───────────────────────────────────
  async function handleToggleAvailable(id: string, value: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: value } : i))
    await supabase.from('pantry_items').update({ is_available: value }).eq('id', id)
  }

  // ── Star ingredient (only one at a time) ──────────────────
  async function handleToggleStar(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return

    const newVal = !item.is_star_ingredient

    // Clear all stars first, then set this one
    setItems(prev => prev.map(i => ({ ...i, is_star_ingredient: i.id === id ? newVal : false })))

    // Clear all in DB for this user, then set
    await supabase
      .from('pantry_items')
      .update({ is_star_ingredient: false })
      .eq('user_id', user!.id)

    if (newVal) {
      await supabase.from('pantry_items').update({ is_star_ingredient: true }).eq('id', id)
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('pantry_items').delete().eq('id', id)
  }

  // ── Edit ──────────────────────────────────────────────────
  async function handleEdit(id: string, fields: {
    name: string
    category: PantryCategory
    secondary_categories: PantryCategory[]
    store_name: string | null
    quantity: string | null
  }) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i))
    await supabase.from('pantry_items').update(fields).eq('id', id)
  }

  // ── Filtered + grouped items ──────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const lower = search.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(lower))
  }, [items, search])

  const grouped = useMemo(() => {
    const map = new Map<PantryCategory, PantryItem[]>()
    for (const item of filtered) {
      // Add to primary category
      const primary = map.get(item.category) ?? []
      if (!primary.find(i => i.id === item.id)) primary.push(item)
      map.set(item.category, primary)
      // Add to each secondary category
      for (const sec of (item.secondary_categories ?? [])) {
        const arr = map.get(sec) ?? []
        if (!arr.find(i => i.id === item.id)) arr.push(item)
        map.set(sec, arr)
      }
    }
    return map
  }, [filtered])

  const starItem = items.find(i => i.is_star_ingredient)
  const availableCount = items.filter(i => i.is_available).length

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-cream-100 dark:bg-charcoal-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-cream-100 dark:bg-charcoal-900">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display font-800 text-2xl text-stone-800 dark:text-stone-100">Your Pantry</h1>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500 mt-0.5">
              {availableCount} of {items.length} items available
              {starItem && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-500 font-display font-600">
                  · ⭐ {starItem.name}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-display font-700 text-sm px-4 py-2 rounded-full shadow-md transition-all duration-150"
          >
            <span className="text-lg leading-none">+</span> Add
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your pantry…"
            className="input-field pl-9 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-3xl animate-simmer">🥬</span>
            <p className="text-sm font-body text-stone-400">Loading your pantry…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
            <span className="text-5xl">🧺</span>
            <h3 className="font-display font-700 text-stone-700 dark:text-stone-300">Your pantry is empty</h3>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">
              Your pantry is waiting! Tap the <strong>+</strong> button to add your first ingredient.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-2">
              Add first item
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-body text-stone-400">No items match "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {CATEGORY_ORDER.filter(cat => grouped.has(cat)).map(cat => (
              <PantrySection
                key={cat}
                category={cat}
                items={grouped.get(cat)!}
                onToggleAvailable={handleToggleAvailable}
                onToggleStar={handleToggleStar}
                onEdit={setEditingItem}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add item sheet */}
      {showAdd && (
        <AddItemSheet
          onAdd={async (fields) => { await handleAdd(fields) }}
          onClose={() => setShowAdd(false)}
          suggestions={vocabulary}
        />
      )}

      {/* Edit item sheet */}
      {editingItem && (
        <EditItemSheet
          item={editingItem}
          onSave={handleEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
