import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PantryItem, PantryCategory } from '../types/database'
import { CATEGORY_ORDER, CATEGORY_META } from '../components/pantry/categoryMeta'
import PantrySection from '../components/pantry/PantrySection'
import AddItemSheet from '../components/pantry/AddItemSheet'
import EditItemSheet from '../components/pantry/EditItemSheet'
import PantryChat from '../components/pantry/PantryChat'
import { violatesDiet } from '../utils/diet'
import { ALLERGENS } from '../utils/allergens'

// Short-form label for the PantrySection chip: "⚠️ 2 not vegetarian"
// Intentionally shorter than dietLabel() from utils/diet, which returns "vegetarian (no eggs)".
function pantryDietLabel(diet: string): string {
  if (diet === 'vegan') return 'vegan'
  if (diet === 'vegetarian') return 'vegetarian'
  if (diet === 'vegetarian_with_eggs') return 'eggitarian'
  return ''
}

export default function PantryPage() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [vocabulary, setVocabulary] = useState<string[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PantryCategory | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [groceryNames, setGroceryNames] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const tocRef = useRef<HTMLDivElement>(null)
  const isNavigatingRef = useRef(false)
  const didBackfillCategoriesRef = useRef(false)

  useEffect(() => {
    if (!user) return
    fetchItems()
    fetchVocabulary()
    fetchGroceryNames()
  }, [user])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user!.id)
      .order('added_at', { ascending: false })
    if (error) {
      console.error('PantryPage fetchItems failed:', error)
      setFetchError(true)
      setLoading(false)
      return
    }
    setFetchError(false)
    const fetched = (data as PantryItem[]) ?? []
    setItems(fetched)
    setLoading(false)

    // One-time per session: recategorize items stuck in "other" with no ai_tags
    // Process sequentially to avoid hitting Claude API rate limits
    if (!didBackfillCategoriesRef.current) {
      didBackfillCategoriesRef.current = true
      const needsCategorizing = fetched.filter(i => i.category === 'other')
      if (needsCategorizing.length > 0) {
        ;(async () => {
          for (const item of needsCategorizing) {
            await triggerAICategorize(item, '')
            await new Promise(r => setTimeout(r, 400))
          }
        })()
      }
    }
  }

  async function fetchGroceryNames() {
    const { data } = await supabase
      .from('grocery_list')
      .select('name')
      .eq('user_id', user!.id)
      .eq('is_checked', false)
    setGroceryNames(new Set((data ?? []).map((r: { name: string }) => r.name.toLowerCase())))
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
    await upsertVocabulary(fields.name)
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
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data } : i))
      }
    } catch { /* silent */ }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleToggleAvailable(id: string, value: boolean) {
    const item = items.find(i => i.id === id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: value } : i))
    await supabase.from('pantry_items').update({ is_available: value }).eq('id', id)

    if (!value && item) {
      const { data: existing } = await supabase
        .from('grocery_list')
        .select('id')
        .eq('user_id', user!.id)
        .ilike('name', item.name)
        .maybeSingle()

      if (!existing) {
        await supabase.from('grocery_list').insert({
          user_id: user!.id,
          name: item.name,
          category: item.category,
          is_checked: false,
        })
        setGroceryNames(prev => new Set([...prev, item.name.toLowerCase()]))
        showToast(`🛒 ${item.name} added to grocery run`)
      } else {
        showToast(`${item.name} is already on your list`)
      }
    }
  }

  async function handleToggleStar(id: string) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newVal = !item.is_star_ingredient
    setItems(prev => prev.map(i => ({ ...i, is_star_ingredient: i.id === id ? newVal : false })))
    await supabase.from('pantry_items').update({ is_star_ingredient: false }).eq('user_id', user!.id)
    if (newVal) await supabase.from('pantry_items').update({ is_star_ingredient: true }).eq('id', id)
  }

  async function handleDelete(id: string) {
    const item = items.find(i => i.id === id)
    const snapshot = items
    setItems(prev => prev.filter(i => i.id !== id))
    if (item) setGroceryNames(prev => { const next = new Set(prev); next.delete(item.name.toLowerCase()); return next })
    const { error } = await supabase.from('pantry_items').delete().eq('id', id)
    if (error) {
      console.error('PantryPage handleDelete failed:', error)
      setItems(snapshot)
      return
    }
    if (item) {
      await supabase.from('grocery_list').delete().eq('user_id', user!.id).ilike('name', item.name)
    }
  }

  async function handleEdit(id: string, fields: {
    name: string; category: PantryCategory; secondary_categories: PantryCategory[]
    store_name: string | null; quantity: string | null
  }) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i))
    await supabase.from('pantry_items').update(fields).eq('id', id)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const lower = search.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(lower))
  }, [items, search])

  const grouped = useMemo(() => {
    const map = new Map<PantryCategory, PantryItem[]>()
    for (const item of filtered) {
      const primary = map.get(item.category) ?? []
      if (!primary.find(i => i.id === item.id)) primary.push(item)
      map.set(item.category, primary)
      for (const sec of (item.secondary_categories ?? [])) {
        const arr = map.get(sec) ?? []
        if (!arr.find(i => i.id === item.id)) arr.push(item)
        map.set(sec, arr)
      }
    }
    return map
  }, [filtered])

  const visibleCategories = CATEGORY_ORDER.filter(cat => grouped.has(cat))

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget
    setShowScrollTop(container.scrollTop > 200)
    if (isNavigatingRef.current) return  // ignore scroll events during programmatic navigation

    const containerTop = container.getBoundingClientRect().top
    let current: PantryCategory | null = visibleCategories[0] ?? null
    for (const cat of visibleCategories) {
      const el = container.querySelector(`[data-category="${cat}"]`) as HTMLElement
      if (!el) continue
      const relativeTop = el.getBoundingClientRect().top - containerTop
      if (relativeTop <= 60) current = cat
    }
    if (current !== activeCategory) {
      setActiveCategory(current)
      const toc = tocRef.current
      const btn = toc?.querySelector(`[data-toc="${current}"]`) as HTMLElement
      if (toc && btn) {
        toc.scrollTo({ top: btn.offsetTop - toc.offsetHeight / 2 + btn.offsetHeight / 2, behavior: 'smooth' })
      }
    }
  }

  function scrollToSection(cat: PantryCategory) {
    const container = scrollRef.current
    if (!container) return
    const el = container.querySelector(`[data-category="${cat}"]`) as HTMLElement
    if (el) {
      // Lock scroll-tracking for 700ms so the smooth animation doesn't override the active category
      isNavigatingRef.current = true
      setActiveCategory(cat)
      // Delta-based scroll: puts the section header 12px below the container top
      const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top - 12
      container.scrollBy({ top: delta, behavior: 'smooth' })
      setTimeout(() => { isNavigatingRef.current = false }, 700)
    }
  }

  const starItem = items.find(i => i.is_star_ingredient)
  const availableCount = items.filter(i => i.is_available).length
  const hasContent = !loading && filtered.length > 0

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Sticky header */}
      <div className={`sticky top-0 z-10 px-4 pt-4 pb-3 bg-transparent transition-shadow duration-200 ${showScrollTop ? 'shadow-md shadow-stone-200/60 dark:shadow-black/40' : ''}`}>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">✕</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pb-24"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-3xl animate-simmer">🥬</span>
            <p className="text-sm font-body text-stone-400">Loading your pantry…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
            <p className="text-sm font-body text-stone-500 dark:text-stone-400">Couldn't load your pantry. Try refreshing.</p>
            <button onClick={fetchItems} className="btn-primary mt-1">Refresh</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
            <span className="text-5xl">🧺</span>
            <h3 className="font-display font-700 text-stone-700 dark:text-stone-300">Your pantry is empty</h3>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">
              Tap the <strong>+</strong> button to add your first ingredient.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-2">Add first item</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-body text-stone-400">No items match "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {visibleCategories.map(cat => {
              const diet = profile?.dietary_preference ?? 'non_vegetarian'
              const userAllergies = profile?.allergies ?? []
              const sectionItems = grouped.get(cat)!
              const conflictIds = diet === 'non_vegetarian' ? new Set<string>()
                : new Set(sectionItems.filter(i => i.is_available && violatesDiet(i.name, diet)).map(i => i.id))
              const allergenIds = userAllergies.length === 0 ? new Set<string>()
                : new Set(sectionItems.filter(i => {
                    const nameLower = i.name.toLowerCase()
                    return ALLERGENS.some(a => userAllergies.includes(a.id) && a.keywords.some(kw => nameLower.includes(kw)))
                  }).map(i => i.id))
              return (
                <PantrySection
                  key={cat}
                  category={cat}
                  items={sectionItems}
                  onToggleAvailable={handleToggleAvailable}
                  onToggleStar={handleToggleStar}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  dietConflictCount={conflictIds.size}
                  dietLabel={pantryDietLabel(diet)}
                  conflictItemIds={conflictIds}
                  allergenItemIds={allergenIds}
                  groceryNames={groceryNames}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Section TOC — right side nav */}
      {hasContent && visibleCategories.length > 1 && (
        <div
          ref={tocRef}
          className="fixed right-1 md:right-3 top-44 bottom-20 z-20 flex flex-col items-end gap-0.5 overflow-y-auto scrollbar-none py-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleCategories.map(cat => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                data-toc={cat}
                onClick={() => scrollToSection(cat)}
                title={CATEGORY_META[cat].label}
                className={`flex items-center gap-1.5 transition-all duration-150 rounded-full flex-shrink-0
                  h-6 w-6 justify-center
                  md:h-7 md:w-auto md:px-2.5 md:justify-start
                  ${active
                    ? 'bg-brand-500 text-white shadow-md md:scale-105'
                    : 'bg-white/85 dark:bg-charcoal-800/85 text-stone-400 hover:bg-brand-100 dark:hover:bg-charcoal-700 backdrop-blur-sm shadow-sm'
                  }`}
              >
                <span className="text-[11px] md:text-sm leading-none">{CATEGORY_META[cat].emoji}</span>
                <span className={`hidden md:inline text-xs font-display font-600 whitespace-nowrap leading-none
                  ${active ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>
                  {CATEGORY_META[cat].label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Scroll-to-top FAB */}
      {showScrollTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-9 z-20 w-8 h-8 rounded-full bg-white dark:bg-charcoal-800 shadow-lg border border-stone-200 dark:border-charcoal-700 flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-charcoal-700 transition-all animate-fade-in font-bold text-sm"
          title="Back to top"
        >
          ↑
        </button>
      )}

      {/* AI Chat FAB */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)', boxShadow: '0 4px 20px rgba(232,113,58,0.40)', color: '#fff' }}
        title="Update pantry with AI"
      >
        <span className="text-base leading-none">✨</span>
        <span className="text-sm font-display font-700">Update with AI</span>
      </button>

      {showAdd && (
        <AddItemSheet
          onAdd={async (fields) => { await handleAdd(fields) }}
          onClose={() => setShowAdd(false)}
          suggestions={vocabulary}
          existingItems={items}
        />
      )}

      {editingItem && (
        <EditItemSheet
          item={editingItem}
          onSave={handleEdit}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showChat && (
        <PantryChat
          pantryItems={items}
          onPantryUpdate={fetchItems}
          onClose={() => setShowChat(false)}
        />
      )}

      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-sm font-display font-600 text-white shadow-lg animate-pop"
          style={{ background: '#E8713A', whiteSpace: 'nowrap' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
