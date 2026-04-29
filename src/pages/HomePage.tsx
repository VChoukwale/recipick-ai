import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { DayStatus, AiRecipe } from '../types/database'
import DayStatusPicker from '../components/home/DayStatusPicker'
import RecipeCard from '../components/home/RecipeCard'
import RecipeDetailSheet from '../components/home/RecipeDetailSheet'
import CookingSpinner from '../components/ui/CookingSpinner'

function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 160, behavior: 'smooth' })
  return (
    <div className="relative">
      <button type="button" onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-md transition-opacity hover:opacity-90"
        style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)' }}>‹</button>
      <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-none px-7">
        {children}
      </div>
      <button type="button" onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-md transition-opacity hover:opacity-90"
        style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)' }}>›</button>
    </div>
  )
}

const STATUS_MESSAGE: Record<DayStatus, string> = {
  home_all_day: 'Take your time today ✨',
  busy_until:   'Quick meal suggestion incoming ⏰',
  late_night:   'Something cozy & quick 🌙',
  quick_only:   'Fast and delicious ⚡',
}

const CUISINES = ['Any', 'Indian', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Korean', 'Mediterranean', 'Middle Eastern', 'American', 'Greek', 'French', 'Vietnamese', 'Ethiopian', 'Spanish', 'Turkish', 'Moroccan', 'Lebanese', 'Peruvian']

import { violatesDiet, dietLabel } from '../utils/diet'
const MOODS = ['Any mood', 'Quick & Easy', 'Comfort Food', 'Healthy & Light', 'Street Food', 'Festive', 'One-Pot']
const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍿 Snack' },
  { value: 'drink', label: '🥤 Drinks' },
]
const EQUIPMENT_OPTIONS = [
  { value: 'stove', label: '🔥 Stove' },
  { value: 'oven', label: '🫙 Oven' },
  { value: 'microwave', label: '📡 Microwave' },
  { value: 'air_fryer', label: '💨 Air Fryer' },
]

const REGIONS: Record<string, string[]> = {
  Indian:          ['Maharashtra', 'Punjab', 'Tamil Nadu', 'Kerala', 'Bengal', 'Goa', 'Rajasthan', 'Gujarat', 'Andhra Pradesh', 'Karnataka', 'Hyderabadi', 'Kashmiri', 'Bihari', 'Odia', 'Assamese'],
  Italian:         ['Sicilian', 'Neapolitan', 'Roman', 'Venetian', 'Tuscan', 'Sardinian', 'Ligurian', 'Piedmontese', 'Umbrian', 'Calabrian'],
  Chinese:         ['Sichuan', 'Cantonese', 'Hunan', 'Shanghainese', 'Beijing', 'Fujian', 'Yunnan', 'Xinjiang', 'Hakka'],
  Mexican:         ['Oaxacan', 'Yucatecan', 'Veracruz', 'Pueblan', 'Norteño', 'Mexico City', 'Jalisco', 'Baja'],
  Japanese:        ['Osaka', 'Tokyo', 'Kyoto', 'Hokkaido', 'Fukuoka', 'Okinawan', 'Nagoya', 'Hiroshima'],
  Korean:          ['Seoul', 'Jeolla', 'Gyeongsang', 'Jeju Island', 'Gangwon'],
  Thai:            ['Northern Thai', 'Southern Thai', 'Central Thai', 'Isan (Northeast)', 'Bangkok'],
  Mediterranean:   ['Greek', 'Lebanese', 'Moroccan', 'Spanish', 'Turkish', 'Egyptian', 'Libyan'],
  'Middle Eastern':['Lebanese', 'Persian', 'Turkish', 'Egyptian', 'Syrian', 'Yemeni', 'Israeli', 'Iraqi', 'Jordanian'],
  Greek:           ['Cretan', 'Macedonian', 'Athenian', 'Ionian Islands', 'Thessaloniki'],
  French:          ['Provençal', 'Lyonnaise', 'Breton', 'Alsatian', 'Basque', 'Parisian', 'Bordelaise'],
  American:        ['Southern', 'Cajun/Creole', 'New England', 'Tex-Mex', 'Southwest', 'Pacific Northwest', 'Hawaiian'],
  Vietnamese:      ['Hanoi', 'Ho Chi Minh City', 'Hue', 'Hoi An', 'Mekong Delta'],
  Ethiopian:       ['Addis Ababa', 'Tigray', 'Oromia', 'Amhara'],
  Spanish:         ['Catalan', 'Andalusian', 'Basque', 'Galician', 'Valencian', 'Castilian', 'Canarian'],
  Turkish:         ['Istanbul', 'Aegean', 'Black Sea', 'Southeast Anatolian', 'Central Anatolian'],
  Moroccan:        ['Marrakech', 'Fez', 'Casablanca', 'Tangier', 'Berber'],
  Lebanese:        ['Beirut', 'Mountain', 'South Lebanese', 'Bekaa Valley'],
  Peruvian:        ['Lima', 'Arequipa', 'Cusco', 'Amazon', 'Andean'],
}

interface PantryChip { id: string; name: string; is_star_ingredient: boolean }

export default function HomePage() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dayStatus, setDayStatus] = useState<DayStatus>('home_all_day')
  const [busyUntilTime, setBusyUntilTime] = useState('')
  const [recipes, setRecipes] = useState<AiRecipe[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<AiRecipe | null>(null)
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set())
  const [likedTitles, setLikedTitles] = useState<string[]>([])
  const [dislikedTitles, setDislikedTitles] = useState<string[]>([])
  const [error, setError] = useState('')
  const [hasAsked, setHasAsked] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [dismissedConflict, setDismissedConflict] = useState(false)

  // Ingredient focus picker
  const [pantryItems, setPantryItems] = useState<PantryChip[]>([])
  const [focusIds, setFocusIds] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState('')

  // Cuisine, region & mood
  const [cuisine, setCuisine] = useState('Any')
  const [region, setRegion] = useState('')
  const [mood, setMood] = useState('Any mood')
  const [dishSearch, setDishSearch] = useState('')
  const [mealType, setMealType] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [showCuisine, setShowCuisine] = useState(false)
  const [showRegion, setShowRegion] = useState(false)
  const [showMood, setShowMood] = useState(false)
  const [showMealType, setShowMealType] = useState(false)
  const [showEquipment, setShowEquipment] = useState(false)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('last-recipes')
      if (cached) {
        const { recipes: r } = JSON.parse(cached)
        if (r?.length) { setRecipes(r); setHasAsked(true) }
      }
    } catch { /* ignore */ }
  }, [])

  // Pre-fill dish search if navigated here from Chef Sage redirect
  useEffect(() => {
    const dish = searchParams.get('dish')
    if (dish) {
      setDishSearch(dish)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  useEffect(() => {
    if (recipes.length > 0) sessionStorage.setItem('last-recipes', JSON.stringify({ recipes }))
  }, [recipes])

  // Returns recently featured hero ingredients from localStorage (last 3 sessions × 3 recipes = up to 9)
  function getRecentIngredients(): string[] {
    try {
      return JSON.parse(localStorage.getItem('recent-hero-ingredients') ?? '[]')
    } catch { return [] }
  }

  // After each AI response, store the hero ingredient of each recipe (first pantry ingredient or title keyword)
  function trackRecentIngredients(newRecipes: AiRecipe[]) {
    const heroes = newRecipes.map(r => {
      const pantryHero = r.ingredients?.find(i => i.in_pantry)?.name
      return pantryHero ?? r.title.split(' ')[0]
    }).filter(Boolean)
    try {
      const prev: string[] = JSON.parse(localStorage.getItem('recent-hero-ingredients') ?? '[]')
      const merged = [...heroes, ...prev].slice(0, 12) // keep last 12
      localStorage.setItem('recent-hero-ingredients', JSON.stringify(merged))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (profile) {
      setDayStatus(profile.day_status)
      setBusyUntilTime(profile.busy_until_time ?? '')
    }
  }, [profile?.id])

  useEffect(() => {
    if (!user) return
    supabase
      .from('saved_recipes')
      .select('title, rating')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const rows = (data ?? []) as { title: string; rating: number }[]
        setSavedTitles(new Set(rows.map(r => r.title)))
        setLikedTitles(rows.filter(r => r.rating === 1).map(r => r.title))
        setDislikedTitles(rows.filter(r => r.rating === -1).map(r => r.title))
      })
  }, [user])

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

  const pantryConflicts = useMemo(() => {
    const diet = profile?.dietary_preference ?? 'vegetarian'
    if (diet === 'non_vegetarian') return []
    return pantryItems.filter(i => violatesDiet(i.name, diet))
  }, [pantryItems, profile?.dietary_preference])

  const availableCuisines = useMemo(() => {
    const preferred = profile?.preferred_cuisines ?? []
    if (preferred.length === 0) return CUISINES
    return ['Any', ...preferred]
  }, [profile?.preferred_cuisines])

  useEffect(() => {
    if (cuisine !== 'Any' && !availableCuisines.includes(cuisine)) {
      setCuisine('Any')
      setRegion('')
    }
  }, [availableCuisines])

  const focusIngredientNames = pantryItems
    .filter(i => focusIds.has(i.id))
    .map(i => i.name)

  const starItems = pantryItems.filter(i => i.is_star_ingredient)
  const focusedStarNames = pantryItems
    .filter(i => focusIds.has(i.id) && i.is_star_ingredient)
    .map(i => i.name)
  const isStarMode = focusedStarNames.length > 0 && focusIds.size === focusedStarNames.length

  function toggleStarMode() {
    if (isStarMode) {
      setFocusIds(new Set())
    } else {
      setFocusIds(new Set(starItems.map(i => i.id)))
    }
  }

  async function callAiChef(excludedRecipes: string[], append: boolean) {
    const diet = profile?.dietary_preference ?? 'vegetarian'
    const safePantry = pantryItems.filter(i => !violatesDiet(i.name, diet)).map(i => i.name)
    const safeFocus = focusIngredientNames.filter(n => !violatesDiet(n, diet))
    // Only pass recently-used ingredients when no specific focus is chosen (free exploration)
    const recentHeroes = safeFocus.length === 0 ? getRecentIngredients() : []
    const requestBody = {
      pantry_items: safePantry,
      focus_ingredients: safeFocus,
      dietary_preference: diet,
      skill_level: profile?.skill_level ?? 'intermediate',
      day_status: dayStatus,
      busy_until_time: busyUntilTime || null,
      preferred_cuisines: profile?.preferred_cuisines ?? [],
      cuisine_filter: cuisine !== 'Any' ? cuisine : null,
      region_filter: region || null,
      dish_query: dishSearch.trim() || null,
      mood_filter: mood !== 'Any mood' ? mood : null,
      meal_type_filter: mealType || null,
      equipment_filter: equipment.length > 0 ? equipment : null,
      count: 3,
      excluded_recipes: [...excludedRecipes, ...dislikedTitles],
      liked_recipes: likedTitles,
      disliked_recipes: dislikedTitles,
      recently_used_ingredients: recentHeroes,
      variety_seed: Math.floor(Math.random() * 100) + 1,
    }

    async function invoke() {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new DOMException('Timeout', 'AbortError')), 60000)
      )
      const { data, error: fnError } = await Promise.race([
        supabase.functions.invoke('ai-chef', { body: requestBody }),
        timeout,
      ])
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (data?.validation_error) throw new Error('validation_failed')
      return data
    }

    let data: { recipes?: AiRecipe[] }
    try {
      data = await invoke()
    } catch (err) {
      // Don't retry validation failures — retry up to 2 more times on transient errors
      if (err instanceof Error && err.message === 'validation_failed') throw err
      await new Promise(r => setTimeout(r, 2000))
      try {
        data = await invoke()
      } catch (err2) {
        if (err2 instanceof Error && err2.message === 'validation_failed') throw err2
        await new Promise(r => setTimeout(r, 3000))
        data = await invoke()
      }
    }
    const newRecipes: AiRecipe[] = data?.recipes ?? []
    trackRecentIngredients(newRecipes)
    if (append) setRecipes(prev => [...prev, ...newRecipes])
    else setRecipes(newRecipes)
  }

  async function handleAskAI() {
    const diet = profile?.dietary_preference ?? 'vegetarian'
    const focusViolations = focusIngredientNames.filter(n => violatesDiet(n, diet))
    const allFocusViolated = focusViolations.length > 0 && focusViolations.length === focusIngredientNames.length

    if (allFocusViolated) {
      const label = dietLabel(diet)
      setError(`${focusViolations.join(', ')} ${focusViolations.length === 1 ? 'isn\'t' : 'aren\'t'} part of your ${label} diet. Please remove ${focusViolations.length === 1 ? 'it' : 'them'} from your focus ingredients, or update your diet in ⚙️ Settings.`)
      return
    }

    setLoading(true); setError(''); setRecipes([]); setHasAsked(true)
    try { await callAiChef([], false) }
    catch (e: unknown) {
      console.error('ai-chef error:', e)
      const isTimeout = e instanceof Error && e.name === 'AbortError'
      const isValidationFail = e instanceof Error && e.message === 'validation_failed'
      const hasFilters = cuisine !== 'Any' || region || mood !== 'Any mood' || mealType || equipment.length > 0
      setError(isTimeout
        ? 'Request timed out. Check your connection and try again.'
        : isValidationFail
          ? hasFilters
            ? `No ${(profile?.dietary_preference ?? 'vegetarian').replace(/_/g, ' ')} recipes found for ${region ? `${region} ${cuisine}` : cuisine !== 'Any' ? cuisine : 'these filters'}. Try a different region or cuisine.`
            : "We couldn't generate safe recipe matches this time. Try adjusting your filters or pantry items."
          : 'Something went wrong. Please try again.')
    }
    finally { setLoading(false); setCooldown(true); setTimeout(() => setCooldown(false), 5000) }
  }

  async function handleLoadMore() {
    setLoadingMore(true); setError('')
    try { await callAiChef(recipes.map(r => r.title), true) }
    catch (e: unknown) {
      console.error('load more error:', e)
      const isTimeout = e instanceof Error && e.name === 'AbortError'
      const isValidationFail = e instanceof Error && e.message === 'validation_failed'
      setError(isTimeout
        ? 'Request timed out. Try again.'
        : isValidationFail
          ? "We couldn't generate safe recipe matches this time. Try changing your ingredients or filters."
          : 'Something went wrong. Try again?')
    }
    finally { setLoadingMore(false) }
  }

  async function handleSave(recipe: AiRecipe) {
    const substitutions = Object.fromEntries(
      (recipe.missing_ingredients ?? []).map(m => [m.name, m.substitution])
    )
    const { error: saveErr } = await supabase.from('saved_recipes').insert({
      user_id: user!.id, title: recipe.title, description: recipe.description,
      cuisine_type: recipe.cuisine, region_detail: recipe.region_detail,
      ingredients: recipe.ingredients, instructions: recipe.instructions,
      difficulty: recipe.difficulty, time_minutes: recipe.time_minutes,
      match_percentage: recipe.match_percentage, why_this: recipe.why_this,
      substitutions, source: 'ai_generated',
    })
    if (saveErr) { setError('Could not save recipe. Try again.'); return }
    setSavedTitles(prev => new Set([...prev, recipe.title]))
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.display_name?.split(' ')[0] ?? 'Chef'

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--s0)' }}>
      {/* Greeting */}
      <div className="px-4 pt-5 pb-4" style={{ background: 'var(--s0)' }}>
        <h1 className="font-display font-800 text-[26px] leading-tight" style={{ color: 'var(--t1)' }}>
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-sm font-body mt-1" style={{ color: 'var(--t2)' }}>
          What's your day looking like?
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Day status picker */}
        <div className="mb-4 mt-1">
          <DayStatusPicker value={dayStatus} busyUntilTime={busyUntilTime} onChange={handleDayStatusChange} />
        </div>

        {/* Filter panel — all sections collapsible */}
        <div
          className="mb-4 rounded-[18px] overflow-hidden"
          style={{ background: 'var(--s1)', border: '1px solid var(--bdr-s)' }}
        >
          {/* Cuisine */}
          <div className="px-3 pt-3 pb-3">
            <button type="button" onClick={() => setShowCuisine(v => !v)}
              className="flex items-center gap-1.5 w-full text-left text-[10px] font-display font-700 uppercase tracking-widest mb-0"
              style={{ color: 'var(--t1)' }}>
              <span>Cuisine</span>
              {cuisine !== 'Any' && <span className="normal-case font-500 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#E8713A22', color: '#E8713A' }}>{cuisine}</span>}
              <span className="ml-auto text-[12px]">{showCuisine ? '▲' : '▼'}</span>
            </button>
            {showCuisine && (
              <div className="mt-2.5">
                <ScrollRow>
                  {availableCuisines.map(c => (
                    <button key={c} onClick={() => { setCuisine(cuisine === c ? 'Any' : c); setRegion('') }}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                      style={cuisine === c
                        ? { background: '#E8713A', border: '1px solid #E8713A', color: '#fff', boxShadow: '0 2px 10px rgba(232,113,58,0.35)' }
                        : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                      }>{c}</button>
                  ))}
                </ScrollRow>
                {(profile?.preferred_cuisines ?? []).length > 0 && (
                  <p className="text-[10px] font-body mt-2 px-1" style={{ color: 'var(--t3)' }}>
                    Showing your preferred cuisines · Update anytime in ⚙️ Settings
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Region — nested sub-section, only visible when cuisine is open and selected */}
          {cuisine !== 'Any' && REGIONS[cuisine] && showCuisine && (
            <div className="mx-3 mb-2.5 rounded-xl overflow-hidden" style={{ background: 'var(--s0)', border: '1px solid var(--bdr-s)' }}>
              <div className="px-3 pt-2 pb-2">
                <button type="button" onClick={() => setShowRegion(v => !v)}
                  className="flex items-center gap-1.5 w-full text-left text-[10px] font-display font-700 uppercase tracking-widest"
                  style={{ color: 'var(--t1)' }}>
                  <span style={{ color: 'var(--t3)' }}>↳</span>
                  <span>Region</span>
                  {region && <span className="normal-case font-500 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#50705022', color: '#507050' }}>{region}</span>}
                  <span className="ml-auto text-[12px]">{showRegion ? '▲' : '▼'}</span>
                </button>
                {showRegion && (
                  <div className="mt-2">
                    <ScrollRow>
                      <button onClick={() => setRegion('')}
                        className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                        style={region === ''
                          ? { background: '#507050', border: '1px solid #507050', color: '#fff', boxShadow: '0 2px 10px rgba(80,112,80,0.30)' }
                          : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                        }>Any</button>
                      {REGIONS[cuisine].map(r => (
                        <button key={r} onClick={() => setRegion(region === r ? '' : r)}
                          className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                          style={region === r
                            ? { background: '#507050', border: '1px solid #507050', color: '#fff', boxShadow: '0 2px 10px rgba(80,112,80,0.30)' }
                            : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                          }>{r}</button>
                      ))}
                    </ScrollRow>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mood */}
          <div className="h-px mx-3" style={{ background: 'var(--bdr-s)' }} />
          <div className="px-3 pt-2.5 pb-3">
            <button type="button" onClick={() => setShowMood(v => !v)}
              className="flex items-center gap-1.5 w-full text-left text-[10px] font-display font-700 uppercase tracking-widest mb-0"
              style={{ color: 'var(--t1)' }}>
              <span>Mood</span>
              {mood !== 'Any mood' && <span className="normal-case font-500 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#E8713A22', color: '#E8713A' }}>{mood}</span>}
              <span className="ml-auto text-[12px]">{showMood ? '▲' : '▼'}</span>
            </button>
            {showMood && (
              <div className="mt-2.5">
                <ScrollRow>
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setMood(mood === m ? 'Any mood' : m)}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                      style={mood === m
                        ? { background: '#E8713A', border: '1px solid #E8713A', color: '#fff', boxShadow: '0 2px 10px rgba(232,113,58,0.35)' }
                        : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                      }>{m}</button>
                  ))}
                </ScrollRow>
              </div>
            )}
          </div>

          {/* Meal Type */}
          <div className="h-px mx-3" style={{ background: 'var(--bdr-s)' }} />
          <div className="px-3 pt-2.5 pb-3">
            <button type="button" onClick={() => setShowMealType(v => !v)}
              className="flex items-center gap-1.5 w-full text-left text-[10px] font-display font-700 uppercase tracking-widest mb-0"
              style={{ color: 'var(--t1)' }}>
              <span>Meal Type</span>
              {mealType && <span className="normal-case font-500 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#E8713A22', color: '#E8713A' }}>{MEAL_TYPES.find(mt => mt.value === mealType)?.label}</span>}
              <span className="ml-auto text-[12px]">{showMealType ? '▲' : '▼'}</span>
            </button>
            {showMealType && (
              <div className="mt-2.5">
                <ScrollRow>
                  {MEAL_TYPES.map(mt => (
                    <button key={mt.value} onClick={() => setMealType(mealType === mt.value ? '' : mt.value)}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                      style={mealType === mt.value
                        ? { background: '#E8713A', border: '1px solid #E8713A', color: '#fff', boxShadow: '0 2px 10px rgba(232,113,58,0.35)' }
                        : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                      }>{mt.label}</button>
                  ))}
                </ScrollRow>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="h-px mx-3" style={{ background: 'var(--bdr-s)' }} />
          <div className="px-3 pt-2.5 pb-3">
            <button type="button" onClick={() => setShowEquipment(v => !v)}
              className="flex items-center gap-1.5 w-full text-left text-[10px] font-display font-700 uppercase tracking-widest mb-0"
              style={{ color: 'var(--t1)' }}>
              <span>Equipment</span>
              {equipment.length > 0 && <span className="normal-case font-500 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#E8713A22', color: '#E8713A' }}>{equipment.length} selected</span>}
              <span className="ml-auto text-[12px]">{showEquipment ? '▲' : '▼'}</span>
            </button>
            {showEquipment && (
              <div className="flex gap-2 flex-wrap mt-2.5">
                {EQUIPMENT_OPTIONS.map(eq => {
                  const active = equipment.includes(eq.value)
                  return (
                    <button key={eq.value} type="button"
                      onClick={() => setEquipment(prev => active ? prev.filter(e => e !== eq.value) : [...prev, eq.value])}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-display font-600 transition-all duration-150 active:scale-95 whitespace-nowrap"
                      style={active
                        ? { background: '#E8713A', border: '1px solid #E8713A', color: '#fff', boxShadow: '0 2px 10px rgba(232,113,58,0.35)' }
                        : { background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)', boxShadow: 'var(--shd-sm)' }
                      }>{eq.label}</button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dish / ingredient search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: 'var(--t3)' }}>🔎</span>
          <input
            value={dishSearch}
            onChange={e => setDishSearch(e.target.value)}
            placeholder="Looking for a specific dish or recipe? (optional)"
            className="input-field pl-10"
          />
          {dishSearch && (
            <button
              onClick={() => setDishSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: 'var(--t3)' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Star Mode quick toggle — visible when star ingredients exist */}
        {starItems.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={toggleStarMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-700 transition-all duration-200"
              style={isStarMode
                ? { background: '#FBBD23', border: '1px solid #FBBD23', color: '#fff', boxShadow: '0 2px 8px rgba(251,189,35,0.35)' }
                : { background: 'var(--s2)', border: '1px solid rgba(251,189,35,0.40)', color: '#B08010', boxShadow: 'var(--shd-sm)' }
              }
            >
              ⭐ Star Mode
            </button>
            {focusIds.size > 0 && (
              <span className="text-xs font-body" style={{ color: 'var(--t2)' }}>
                hero: {focusIngredientNames.join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Ingredient focus picker */}
        {pantryItems.length > 0 && (
          <div
            className="mb-4 rounded-[18px] overflow-hidden transition-all duration-200"
            style={{
              background: 'var(--s2)',
              border: `1px solid ${focusIds.size > 0 ? 'rgba(232,113,58,0.35)' : 'var(--bdr-m)'}`,
              boxShadow: 'var(--shd-sm)',
            }}
          >
            <button
              onClick={() => setShowPicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base flex-shrink-0">{focusIds.size > 0 ? '⭐' : '🎯'}</span>
                <span className="font-display font-700 text-sm flex-1 min-w-0" style={{ color: 'var(--t1)' }}>
                  {focusIds.size > 0 ? `${focusIds.size} ingredient${focusIds.size > 1 ? 's' : ''} selected` : 'Cook with specific ingredients?'}
                </span>
              </div>
              <span className={`text-xs flex-shrink-0 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} style={{ color: 'var(--t3)' }}>▼</span>
            </button>

            {showPicker && (
              <div className="px-4 pb-4">
                <p className="text-xs font-body mb-3" style={{ color: 'var(--t3)' }}>
                  Tap ingredients to cook with — recipes will be built around them as the hero. Leaving empty uses your full pantry.
                </p>

                {/* Search */}
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--t3)' }}>🔍</span>
                  <input
                    value={ingredientSearch}
                    onChange={e => setIngredientSearch(e.target.value)}
                    placeholder="Search ingredients…"
                    className="input-field pl-8"
                    style={{ padding: '8px 16px 8px 32px' }}
                  />
                  {ingredientSearch && (
                    <button
                      onClick={() => setIngredientSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'var(--t3)' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                  {filteredPickerItems.map(item => {
                    const focused = focusIds.has(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleFocus(item.id)}
                        className="px-2.5 py-1 rounded-full text-xs font-display font-600 transition-all duration-150"
                        style={focused
                          ? item.is_star_ingredient
                            ? { background: '#FBBD23', border: '1px solid #FBBD23', color: '#fff' }
                            : { background: '#E8713A', border: '1px solid #E8713A', color: '#fff' }
                          : { background: 'var(--s1)', border: '1px solid var(--bdr-m)', color: 'var(--t2)' }
                        }
                      >
                        {item.is_star_ingredient && '⭐ '}{item.name}
                      </button>
                    )
                  })}
                  {filteredPickerItems.length === 0 && (
                    <p className="text-xs font-body" style={{ color: 'var(--t3)' }}>No items match "{ingredientSearch}"</p>
                  )}
                </div>
                {focusIds.size > 0 && (
                  <button
                    onClick={() => setFocusIds(new Set())}
                    className="mt-2 text-xs font-display font-600"
                    style={{ color: 'var(--t3)' }}
                  >
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
          disabled={loading || loadingMore || cooldown}
          className="w-full py-4 rounded-2xl font-display font-700 text-[15px] text-white flex items-center justify-center gap-2.5 mb-5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
          style={{
            background: focusIds.size > 0
              ? 'linear-gradient(150deg, #FBBD23 0%, #E09518 100%)'
              : 'linear-gradient(150deg, #F07840 0%, #D85F22 100%)',
            boxShadow: focusIds.size > 0
              ? '0 6px 28px rgba(240,185,30,0.38)'
              : '0 6px 28px rgba(232,113,58,0.40)',
          }}
        >
          {loading
            ? <><span className="text-lg animate-spin">🍳</span><span>Cooking up ideas…</span></>
            : cooldown
              ? <><span className="text-lg">⏳</span><span>Wait a moment…</span></>
              : focusIds.size > 0
                ? <><span className="text-lg">⭐</span><span>Cook with {focusIngredientNames[0]}{focusIngredientNames.length > 1 ? ` +${focusIngredientNames.length - 1}` : ''}</span></>
                : (cuisine !== 'Any' || mood !== 'Any mood' || mealType || equipment.length > 0 || dishSearch.trim() || region)
                  ? <><span className="text-lg">✨</span><span>Suggest recipes</span></>
                  : <><span className="text-lg">✨</span><span>Cook for me</span></>
          }
        </button>

        {error && <p className="text-sm text-red-500 text-center mb-4 font-body">{error}</p>}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CookingSpinner size="lg" label="Finding the perfect recipes…" />
          </div>
        )}

        {!loading && recipes.length > 0 && (
          <>
            <p className="text-xs font-body mb-3 text-center" style={{ color: 'var(--t3)' }}>
              {STATUS_MESSAGE[dayStatus]}
              {cuisine !== 'Any' && <span className="ml-1">· {region ? `${region} (${cuisine})` : cuisine}</span>}
              {mood !== 'Any mood' && <span className="ml-1">· {mood}</span>}
              {dishSearch.trim() && <span className="ml-1">· "{dishSearch.trim()}"</span>}
              {focusIds.size > 0 && <span className="ml-1">· hero: {focusIngredientNames.join(', ')}</span>}
            </p>
            <div className="space-y-3">
              {recipes.map((recipe, i) => (
                <div key={`${recipe.title}-${i}`} className="animate-card-enter" style={{ animationDelay: `${i * 80}ms` }}>
                  <RecipeCard recipe={recipe} saved={savedTitles.has(recipe.title)}
                    onView={() => setSelectedRecipe(recipe)} onSave={() => handleSave(recipe)}
                    userAllergies={profile?.allergies ?? []} />
                </div>
              ))}
            </div>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-2 py-3 rounded-2xl font-display font-700 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors disabled:opacity-50"
              style={{ border: '2px dashed rgba(232,113,58,0.35)', color: '#E8713A' }}
            >
              {loadingMore
                ? <span className="flex items-center justify-center gap-2"><span className="animate-simmer">🍳</span> Finding more ideas…</span>
                : '✦ Get more recipe ideas'}
            </button>
            {loadingMore && (
              <div className="flex justify-center py-6">
                <CookingSpinner size="md" label="Finding more ideas…" />
              </div>
            )}
          </>
        )}

        {!dismissedConflict && pantryConflicts.length > 0 && (
          <div className="mx-1 mb-4 px-4 py-3 rounded-2xl flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-sm text-orange-700">Pantry items not matching your diet</p>
              <p className="text-xs font-body text-orange-600 mt-0.5 leading-relaxed">
                <strong>{pantryConflicts.map(i => i.name).join(', ')}</strong> {pantryConflicts.length === 1 ? 'isn\'t' : 'aren\'t'} part of your {dietLabel(profile?.dietary_preference ?? '')} diet and won't be used for suggestions. Update your pantry or change your diet in ⚙️ Settings.
              </p>
            </div>
            <button onClick={() => setDismissedConflict(true)} className="flex-shrink-0 text-orange-400 hover:text-orange-600 text-sm mt-0.5">✕</button>
          </div>
        )}

        {!loading && !hasAsked && pantryItems.length === 0 && (
          <div className="mx-1 mb-4 px-4 py-3 rounded-2xl flex items-start gap-3" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)' }}>
            <span className="text-xl flex-shrink-0">🥄</span>
            <div>
              <p className="font-display font-700 text-sm" style={{ color: 'var(--t1)' }}>Your pantry is empty</p>
              <p className="text-xs font-body mt-0.5" style={{ color: 'var(--t3)' }}>
                Add ingredients to your pantry for personalised recipe matches. You can still generate ideas below.
              </p>
            </div>
          </div>
        )}

        {!loading && !hasAsked && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <CookingSpinner size="lg" />
            <p className="font-display font-700" style={{ color: 'var(--t2)' }}>Your AI chef is ready</p>
            <p className="text-sm font-body max-w-xs" style={{ color: 'var(--t3)' }}>
              Set your day, pick a cuisine, and tap the button — I'll suggest recipes based on what's in your pantry.
            </p>
          </div>
        )}

        {!loading && hasAsked && recipes.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <span className="text-4xl">🤔</span>
            <p className="text-sm font-body" style={{ color: 'var(--t3)' }}>No recipes found. Try adding more items to your pantry!</p>
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
