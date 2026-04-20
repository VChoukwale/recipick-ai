import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { DayStatus, AiRecipe } from '../types/database'
import DayStatusPicker from '../components/home/DayStatusPicker'
import RecipeCard from '../components/home/RecipeCard'
import RecipeDetailSheet from '../components/home/RecipeDetailSheet'

const STATUS_MESSAGE: Record<DayStatus, string> = {
  home_all_day: 'Take your time today ✨',
  busy_until:   'Quick meal suggestion incoming ⏰',
  late_night:   'Something cozy & quick 🌙',
  quick_only:   'Fast and delicious ⚡',
}

const CUISINES = ['Any', 'Indian', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Korean', 'Mediterranean', 'Middle Eastern', 'American', 'Greek', 'French']
const MOODS = ['Any mood', 'Quick & Easy', 'Comfort Food', 'Healthy & Light', 'Street Food', 'Festive', 'One-Pot']

interface PantryChip { id: string; name: string; is_star_ingredient: boolean }

export default function HomePage() {
  const { user, profile } = useAuth()
  const [dayStatus, setDayStatus] = useState<DayStatus>('home_all_day')
  const [busyUntilTime, setBusyUntilTime] = useState('')
  const [recipes, setRecipes] = useState<AiRecipe[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<AiRecipe | null>(null)
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [hasAsked, setHasAsked] = useState(false)

  // Ingredient focus picker
  const [pantryItems, setPantryItems] = useState<PantryChip[]>([])
  const [focusIds, setFocusIds] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState('')

  // Cuisine & mood
  const [cuisine, setCuisine] = useState('Any')
  const [mood, setMood] = useState('Any mood')

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('last-recipes')
      if (cached) {
        const { recipes: r } = JSON.parse(cached)
        if (r?.length) { setRecipes(r); setHasAsked(true) }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (recipes.length > 0) sessionStorage.setItem('last-recipes', JSON.stringify({ recipes }))
  }, [recipes])

  useEffect(() => {
    if (profile) {
      setDayStatus(profile.day_status)
      setBusyUntilTime(profile.busy_until_time ?? '')
    }
  }, [profile?.id])

  useEffect(() => {
    if (!user) return
    supabase
      .from('pantry_items')
      .select('id, name, is_star_ingredient')
      .eq('user_id', user.id)
      .eq('is_available', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
        const items = (data ?? []) as PantryChip[]
        setPantryItems(items)
        // Auto-select starred items as focus
        const starred = new Set(items.filter(i => i.is_star_ingredient).map(i => i.id))
        if (starred.size > 0) setFocusIds(starred)
      })
  }, [user])

  async function handleDayStatusChange(status: DayStatus, time?: string) {
    setDayStatus(status)
    const t = time ?? ''
    setBusyUntilTime(t)
    await supabase
      .from('profiles')
      .update({ day_status: status, busy_until_time: status === 'busy_until' && t ? t : null })
      .eq('id', user!.id)
  }

  function toggleFocus(id: string) {
    setFocusIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredPickerItems = useMemo(() => {
    if (!ingredientSearch.trim()) return pantryItems
    const lower = ingredientSearch.toLowerCase()
    return pantryItems.filter(i => i.name.toLowerCase().includes(lower))
  }, [pantryItems, ingredientSearch])

  const focusIngredientNames = pantryItems
    .filter(i => focusIds.has(i.id))
    .map(i => i.name)

  async function callAiChef(excludedRecipes: string[], append: boolean) {
    const { data, error: fnError } = await supabase.functions.invoke('ai-chef', {
      body: {
        pantry_items: pantryItems.map(i => i.name),
        focus_ingredients: focusIngredientNames,
        dietary_preference: profile?.dietary_preference ?? 'vegetarian',
        skill_level: profile?.skill_level ?? 'intermediate',
        day_status: dayStatus,
        busy_until_time: busyUntilTime || null,
        preferred_cuisines: profile?.preferred_cuisines ?? [],
        cuisine_filter: cuisine !== 'Any' ? cuisine : null,
        mood_filter: mood !== 'Any mood' ? mood : null,
        count: 3,
        excluded_recipes: excludedRecipes,
      },
    })
    if (fnError) throw fnError
    if (data?.error) throw new Error(data.error)
    const newRecipes: AiRecipe[] = data?.recipes ?? []
    if (append) setRecipes(prev => [...prev, ...newRecipes])
    else setRecipes(newRecipes)
  }

  async function handleAskAI() {
    setLoading(true); setError(''); setRecipes([]); setHasAsked(true)
    try { await callAiChef([], false) }
    catch (e) { console.error('ai-chef error:', e); setError('Something went wrong. Try again?') }
    finally { setLoading(false) }
  }

  async function handleLoadMore() {
    setLoadingMore(true); setError('')
    try { await callAiChef(recipes.map(r => r.title), true) }
    catch (e) { console.error('load more error:', e); setError('Something went wrong. Try again?') }
    finally { setLoadingMore(false) }
  }

  async function handleSave(recipe: AiRecipe) {
    const substitutions = Object.fromEntries(
      (recipe.missing_ingredients ?? []).map(m => [m.name, m.substitution])
    )
    await supabase.from('saved_recipes').insert({
      user_id: user!.id, title: recipe.title, description: recipe.description,
      cuisine_type: recipe.cuisine, region_detail: recipe.region_detail,
      ingredients: recipe.ingredients, instructions: recipe.instructions,
      difficulty: recipe.difficulty, time_minutes: recipe.time_minutes,
      match_percentage: recipe.match_percentage, why_this: recipe.why_this,
      substitutions, source: 'ai_generated',
    })
    setSavedTitles(prev => new Set([...prev, recipe.title]))
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? 'Chef'

  return (
    <div className="flex flex-col h-full bg-cream-100 dark:bg-charcoal-900">
      <div className="px-4 pt-4 pb-3 bg-cream-100 dark:bg-charcoal-900">
        <h1 className="font-display font-800 text-2xl text-stone-800 dark:text-stone-100">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-sm font-body text-stone-400 dark:text-stone-500 mt-0.5">
          What's your day looking like?
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mb-4">
          <DayStatusPicker value={dayStatus} busyUntilTime={busyUntilTime} onChange={handleDayStatusChange} />
        </div>

        {/* Cuisine */}
        <div className="mb-3">
          <p className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-2">Cuisine</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {CUISINES.map(c => (
              <button key={c} onClick={() => setCuisine(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-600 border transition-all duration-150 ${
                  cuisine === c
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-600 dark:text-stone-400 hover:border-brand-300'
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-4">
          <p className="text-xs font-display font-600 text-stone-500 dark:text-stone-400 mb-2">Mood</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {MOODS.map(m => (
              <button key={m} onClick={() => setMood(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-600 border transition-all duration-150 ${
                  mood === m
                    ? 'bg-sage-500 border-sage-500 text-white'
                    : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-600 dark:text-stone-400 hover:border-sage-300'
                }`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Ingredient focus picker */}
        {pantryItems.length > 0 && (
          <div className="mb-4 bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 overflow-hidden">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base flex-shrink-0">🎯</span>
                <span className="font-display font-700 text-sm text-stone-700 dark:text-stone-200">
                  Cook with specific ingredients?
                </span>
                {focusIds.size > 0 && (
                  <span className="flex-shrink-0 text-xs font-display font-600 px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                    {focusIds.size} selected
                  </span>
                )}
              </div>
              <span className={`text-stone-400 text-xs flex-shrink-0 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showPicker && (
              <div className="px-4 pb-4">
                <p className="text-xs font-body text-stone-400 dark:text-stone-500 mb-3">
                  Tap ingredients you want to cook with — recipes will be built around them as the hero.
                  {focusIds.size === 0 && ' Leaving empty uses your full pantry.'}
                </p>

                {/* Star ingredient callout */}
                {pantryItems.some(i => i.is_star_ingredient) && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs font-body text-amber-700 dark:text-amber-300">
                    ⭐ Star ingredient auto-selected as hero
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
                  <input
                    value={ingredientSearch}
                    onChange={e => setIngredientSearch(e.target.value)}
                    placeholder="Search ingredients…"
                    className="input-field pl-8 text-sm py-2"
                  />
                  {ingredientSearch && (
                    <button onClick={() => setIngredientSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">✕</button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                  {filteredPickerItems.map(item => {
                    const focused = focusIds.has(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleFocus(item.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-display font-600 border transition-all duration-150 ${
                          focused
                            ? item.is_star_ingredient
                              ? 'bg-amber-400 border-amber-400 text-white'
                              : 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-600 dark:text-stone-400 hover:border-brand-300'
                        }`}
                      >
                        {item.is_star_ingredient && '⭐ '}{item.name}
                      </button>
                    )
                  })}
                  {filteredPickerItems.length === 0 && (
                    <p className="text-xs text-stone-400 font-body">No items match "{ingredientSearch}"</p>
                  )}
                </div>
                {focusIds.size > 0 && (
                  <button onClick={() => setFocusIds(new Set())}
                    className="mt-2 text-xs text-stone-400 hover:text-stone-600 font-display font-600">
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleAskAI}
          disabled={loading || loadingMore}
          className="w-full btn-primary flex items-center justify-center gap-2 mb-5"
        >
          {loading
            ? <><span className="animate-simmer text-lg">🍳</span><span>Cooking up ideas…</span></>
            : <><span className="text-lg">✨</span><span>What should I cook?</span></>}
        </button>

        {error && <p className="text-sm text-red-500 text-center mb-4 font-body">{error}</p>}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-charcoal-800 rounded-2xl h-44 animate-pulse border border-cream-200 dark:border-charcoal-700" />
            ))}
          </div>
        )}

        {!loading && recipes.length > 0 && (
          <>
            <p className="text-xs font-body text-stone-400 dark:text-stone-500 mb-3 text-center">
              {STATUS_MESSAGE[dayStatus]}
              {cuisine !== 'Any' && <span className="ml-1">· {cuisine}</span>}
              {mood !== 'Any mood' && <span className="ml-1">· {mood}</span>}
              {focusIds.size > 0 && <span className="ml-1">· hero: {focusIngredientNames.join(', ')}</span>}
            </p>
            <div className="space-y-3">
              {recipes.map((recipe, i) => (
                <RecipeCard key={`${recipe.title}-${i}`} recipe={recipe} saved={savedTitles.has(recipe.title)}
                  onView={() => setSelectedRecipe(recipe)} onSave={() => handleSave(recipe)} />
              ))}
            </div>
            <button onClick={handleLoadMore} disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 font-display font-700 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50">
              {loadingMore
                ? <span className="flex items-center justify-center gap-2"><span className="animate-simmer">🍳</span> Finding more ideas…</span>
                : '✦ Get more recipe ideas'}
            </button>
            {loadingMore && (
              <div className="space-y-3 mt-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white dark:bg-charcoal-800 rounded-2xl h-44 animate-pulse border border-cream-200 dark:border-charcoal-700" />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !hasAsked && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <span className="text-5xl animate-simmer">🍳</span>
            <p className="font-display font-700 text-stone-600 dark:text-stone-400">Your AI chef is ready</p>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500 max-w-xs">
              Set your day, pick a cuisine, and tap the button — I'll suggest recipes based on what's in your pantry.
            </p>
          </div>
        )}

        {!loading && hasAsked && recipes.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <span className="text-4xl">🤔</span>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">No recipes found. Try adding more items to your pantry!</p>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetailSheet recipe={selectedRecipe} saved={savedTitles.has(selectedRecipe.title)}
          onSave={() => handleSave(selectedRecipe)} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  )
}
