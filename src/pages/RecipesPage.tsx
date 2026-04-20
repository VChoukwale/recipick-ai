import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { SavedRecipe, AiRecipe, Difficulty } from '../types/database'
import RecipeDetailSheet from '../components/home/RecipeDetailSheet'

function toAiRecipe(r: SavedRecipe): AiRecipe {
  const missing = Object.entries(r.substitutions ?? {}).map(([name, substitution]) => ({ name, substitution }))
  return {
    title: r.title,
    description: r.description ?? '',
    cuisine: r.cuisine_type ?? '',
    region_detail: r.region_detail,
    difficulty: r.difficulty,
    time_minutes: r.time_minutes ?? 0,
    ingredients: r.ingredients ?? [],
    missing_ingredients: missing,
    match_percentage: r.match_percentage ?? 100,
    instructions: r.instructions ?? [],
    why_this: r.why_this ?? '',
  }
}

const DIFFICULTIES: { label: string; value: Difficulty | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
]

function SourceBadge({ source }: { source: string }) {
  if (source === 'ai_generated')
    return <span className="text-[10px] font-display font-700 px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-500">✨ AI</span>
  if (source === 'web_import')
    return <span className="text-[10px] font-display font-700 px-1.5 py-0.5 rounded-full bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400">🌐 Web</span>
  return null
}

interface CardProps {
  recipe: SavedRecipe
  onView: () => void
  onToggleFavorite: () => void
  onDelete: () => void
}

function VaultRecipeCard({ recipe, onView, onToggleFavorite, onDelete }: CardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-cream-200 dark:border-charcoal-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2 mb-1.5">
          <h3 className="font-display font-700 text-base text-stone-800 dark:text-stone-100 leading-snug flex-1">
            {recipe.title}
          </h3>
          <button onClick={onToggleFavorite}
            className={`flex-shrink-0 text-lg transition-all duration-200 ${recipe.is_favorite ? 'animate-glow-gold' : 'opacity-30 hover:opacity-60'}`}>
            {recipe.is_favorite ? '⭐' : '☆'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <SourceBadge source={recipe.source} />
          {recipe.cuisine_type && (
            <span className="text-xs font-body px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
              {recipe.cuisine_type}{recipe.region_detail ? ` · ${recipe.region_detail}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          {recipe.time_minutes && <span>⏱ {recipe.time_minutes} min</span>}
          <span className={`capitalize font-body ${
            recipe.difficulty === 'easy' ? 'text-emerald-600 dark:text-emerald-400'
            : recipe.difficulty === 'medium' ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          }`}>{recipe.difficulty}</span>
          {recipe.match_percentage != null && (
            <>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className={
                recipe.match_percentage >= 90 ? 'text-emerald-500' :
                recipe.match_percentage >= 75 ? 'text-amber-500' : 'text-orange-500'
              }>{recipe.match_percentage}% match</span>
            </>
          )}
        </div>
      </div>

      <div className="flex border-t border-cream-100 dark:border-charcoal-700/50">
        <button onClick={onView}
          className="flex-1 py-2.5 text-sm font-display font-600 text-brand-600 dark:text-brand-400 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
          See Recipe →
        </button>
        <div className="w-px bg-cream-100 dark:bg-charcoal-700/50" />
        {confirmDelete ? (
          <>
            <button onClick={onDelete}
              className="flex-1 py-2.5 text-sm font-display font-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Remove
            </button>
            <div className="w-px bg-cream-100 dark:bg-charcoal-700/50" />
            <button onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 text-sm font-display font-600 text-stone-400 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="flex-1 py-2.5 text-sm font-display font-600 text-stone-300 dark:text-stone-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            ✕ Remove
          </button>
        )}
      </div>
    </div>
  )
}

export default function RecipesPage() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchRecipes()
  }, [user])

  async function fetchRecipes() {
    setLoading(true)
    const { data } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    setRecipes((data as SavedRecipe[]) ?? [])
    setLoading(false)
  }

  async function handleToggleFavorite(id: string) {
    const recipe = recipes.find(r => r.id === id)
    if (!recipe) return
    const newVal = !recipe.is_favorite
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: newVal } : r))
    await supabase.from('saved_recipes').update({ is_favorite: newVal }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setRecipes(prev => prev.filter(r => r.id !== id))
    if (selectedRecipe?.id === id) setSelectedRecipe(null)
    await supabase.from('saved_recipes').delete().eq('id', id)
  }

  const cuisineOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const r of recipes) if (r.cuisine_type) seen.add(r.cuisine_type)
    return ['All', ...Array.from(seen).sort()]
  }, [recipes])

  const filtered = useMemo(() => recipes.filter(r => {
    if (favoritesOnly && !r.is_favorite) return false
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false
    if (cuisineFilter !== 'All' && r.cuisine_type !== cuisineFilter) return false
    if (search.trim() && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [recipes, search, difficultyFilter, cuisineFilter, favoritesOnly])

  const favoriteCount = recipes.filter(r => r.is_favorite).length
  const hasFilters = !!(search || difficultyFilter !== 'all' || cuisineFilter !== 'All' || favoritesOnly)

  return (
    <div className="flex flex-col h-full bg-cream-100 dark:bg-charcoal-900">
      <div className={`sticky top-0 z-10 px-4 pt-4 pb-3 bg-cream-100 dark:bg-charcoal-900 transition-shadow duration-200 ${showScrollTop ? 'shadow-md shadow-stone-200/60 dark:shadow-black/40' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display font-800 text-2xl text-stone-800 dark:text-stone-100">Recipe Vault</h1>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500 mt-0.5">
              {recipes.length} saved{favoriteCount > 0 ? ` · ${favoriteCount} ⭐ favorited` : ''}
            </p>
          </div>
          {favoriteCount > 0 && (
            <button onClick={() => setFavoritesOnly(f => !f)}
              className={`text-xs font-display font-700 px-3 py-1.5 rounded-full border transition-all ${
                favoritesOnly
                  ? 'bg-amber-400 border-amber-400 text-white'
                  : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-500 dark:text-stone-400'
              }`}>⭐ Favorites</button>
          )}
        </div>

        <div className="relative mt-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search your vault…" className="input-field pl-9 shadow-sm" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">✕</button>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {DIFFICULTIES.map(d => (
            <button key={d.value} onClick={() => setDifficultyFilter(d.value)}
              className={`px-3 py-1 rounded-full text-xs font-display font-600 border transition-all ${
                difficultyFilter === d.value
                  ? 'bg-stone-700 dark:bg-stone-200 border-stone-700 dark:border-stone-200 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-500 dark:text-stone-400'
              }`}>{d.label}</button>
          ))}
        </div>

        {cuisineOptions.length > 2 && (
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none pb-0.5">
            {cuisineOptions.map(c => (
              <button key={c} onClick={() => setCuisineFilter(c)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-display font-600 border transition-all ${
                  cuisineFilter === c
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-600 text-stone-500 dark:text-stone-400'
                }`}>{c}</button>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-24"
        onScroll={e => setShowScrollTop(e.currentTarget.scrollTop > 200)}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-3xl animate-simmer">📖</span>
            <p className="text-sm font-body text-stone-400">Loading your vault…</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
            <span className="text-5xl">📖</span>
            <h3 className="font-display font-700 text-stone-700 dark:text-stone-300">Your vault is empty</h3>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">
              Go to <strong>Home</strong>, ask the AI chef for recipes, and tap <strong>Save</strong> to add them here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-body text-stone-400">No recipes match your filters</p>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setDifficultyFilter('all'); setCuisineFilter('All'); setFavoritesOnly(false) }}
                className="text-xs text-brand-500 font-display font-600 mt-1">Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {filtered.map(recipe => (
              <VaultRecipeCard key={recipe.id} recipe={recipe}
                onView={() => setSelectedRecipe(recipe)}
                onToggleFavorite={() => handleToggleFavorite(recipe.id)}
                onDelete={() => handleDelete(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetailSheet
          recipe={toAiRecipe(selectedRecipe)}
          saved={true}
          onSave={() => {}}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}
