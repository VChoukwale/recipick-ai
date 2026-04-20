import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { SavedRecipe, RecipeIngredient, Difficulty } from '../types/database'
import CookingSpinner from '../components/ui/CookingSpinner'

const SKIP_WATER = new Set(['water', 'warm water', 'cold water', 'hot water', 'water (for boiling)', 'boiling water'])

interface ExtractedRecipe {
  title: string
  description: string
  cuisine_type: string
  region_detail: string | null
  difficulty: Difficulty
  time_minutes: number
  ingredients: { name: string; quantity: string; in_pantry?: boolean }[]
  instructions: string[]
  why_this: string
}

function ImportedRecipeCard({ recipe, onView }: { recipe: SavedRecipe; onView: () => void }) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-cream-200 dark:border-charcoal-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-display font-700 text-sm text-stone-800 dark:text-stone-100 leading-snug flex-1">{recipe.title}</h3>
          <span className="flex-shrink-0 text-[10px] font-display font-700 px-1.5 py-0.5 rounded-full bg-sage-50 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400">🌐 Web</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
          {recipe.cuisine_type && <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-body">{recipe.cuisine_type}</span>}
          {recipe.time_minutes && <span>⏱ {recipe.time_minutes} min</span>}
          <span className={`capitalize font-body ${
            recipe.difficulty === 'easy' ? 'text-emerald-600 dark:text-emerald-400'
            : recipe.difficulty === 'medium' ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          }`}>{recipe.difficulty}</span>
        </div>
      </div>
      <div className="border-t border-cream-100 dark:border-charcoal-700/50">
        <button onClick={onView} className="w-full py-2 text-sm font-display font-600 text-brand-600 dark:text-brand-400 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors">
          See Recipe →
        </button>
      </div>
    </div>
  )
}

function RecipePreviewSheet({ recipe, url, onSave, onClose }: {
  recipe: ExtractedRecipe
  url: string
  onSave: () => void
  onClose: () => void
}) {
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()

  // Use in_pantry from AI (which handles synonyms), fall back to false. Always mark water as in_pantry.
  const ingredients: RecipeIngredient[] = recipe.ingredients.map(i => ({
    name: i.name,
    quantity: i.quantity,
    in_pantry: SKIP_WATER.has(i.name.toLowerCase()) ? true : (i.in_pantry ?? false),
  }))
  const inPantry = ingredients.filter(i => i.in_pantry)
  const missing = ingredients.filter(i => !i.in_pantry)
  const matchPct = ingredients.length > 0 ? Math.round((inPantry.length / ingredients.length) * 100) : 0

  async function handleSave() {
    if (!user || saved) return
    await supabase.from('saved_recipes').insert({
      user_id: user.id,
      title: recipe.title,
      description: recipe.description,
      cuisine_type: recipe.cuisine_type,
      region_detail: recipe.region_detail,
      difficulty: recipe.difficulty,
      time_minutes: recipe.time_minutes,
      ingredients,
      instructions: recipe.instructions,
      match_percentage: matchPct,
      why_this: recipe.why_this,
      source: 'web_import',
      source_url: url || null,
    })
    setSaved(true)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-charcoal-800 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 dark:bg-charcoal-600 rounded-full" />
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-4">
          <div className="flex items-start justify-between gap-3 pt-2 mb-2">
            <h2 className="font-display font-800 text-xl text-stone-800 dark:text-stone-100 leading-snug flex-1">{recipe.title}</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none mt-1 flex-shrink-0">✕</button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {recipe.cuisine_type && <span className="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-body">{recipe.cuisine_type}</span>}
            {recipe.region_detail && <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 dark:bg-charcoal-700 text-stone-500 dark:text-stone-400 font-body">{recipe.region_detail}</span>}
            <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 dark:bg-charcoal-700 text-stone-500 dark:text-stone-400 font-body">⏱ {recipe.time_minutes} min</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-body capitalize ${
              recipe.difficulty === 'easy' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : recipe.difficulty === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>{recipe.difficulty}</span>
          </div>

          {recipe.why_this && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm font-body italic text-brand-700 dark:text-brand-300 leading-relaxed">"{recipe.why_this}"</p>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-stone-400 dark:text-stone-500 font-body">Pantry match</p>
                <span className={`text-xs font-display font-700 ${matchPct >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>{matchPct}%</span>
              </div>
              <div className="h-2 bg-cream-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${matchPct >= 90 ? 'bg-emerald-500' : matchPct >= 75 ? 'bg-amber-500' : 'bg-orange-500'}`} style={{ width: `${matchPct}%` }} />
              </div>
            </div>
          )}

          {inPantry.length > 0 && (
            <div className="mb-4">
              <h3 className="font-display font-700 text-sm text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> You have ({inPantry.length})
              </h3>
              <div className="space-y-1.5">
                {inPantry.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="font-body text-sm text-stone-700 dark:text-stone-300">{ing.name}</span>
                    <span className="font-body text-xs text-stone-400 dark:text-stone-500">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div className="mb-5">
              <h3 className="font-display font-700 text-sm text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <span className="text-orange-400">+</span> You'll need ({missing.length})
              </h3>
              <div className="space-y-1.5">
                {missing.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                    <span className="font-body text-sm text-stone-700 dark:text-stone-300">{ing.name}</span>
                    <span className="font-body text-xs text-stone-400 dark:text-stone-500">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-display font-700 text-sm text-stone-500 dark:text-stone-400 mb-3">Instructions</h3>
            <div className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 text-xs font-display font-700 flex items-center justify-center mt-0.5">{i + 1}</span>
                  <p className="font-body text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-body text-stone-400 dark:text-stone-500 underline break-all">{url}</a>
          )}
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-cream-100 dark:border-charcoal-700/50">
          <button onClick={handleSave} disabled={saved}
            className={`w-full py-3 rounded-2xl font-display font-700 text-sm transition-all ${
              saved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'btn-primary'
            }`}>
            {saved ? '✓ Saved to Recipe Vault' : 'Save to Recipe Vault'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null)
  const [extractedUrl, setExtractedUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [pantryNames, setPantryNames] = useState<Set<string>>(new Set())
  const [imports, setImports] = useState<SavedRecipe[]>([])
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('pantry_items').select('name').eq('user_id', user.id).eq('is_available', true)
      .then(({ data }) => setPantryNames(new Set((data ?? []).map((i: { name: string }) => i.name.toLowerCase()))))
    fetchImports()
  }, [user])

  async function fetchImports() {
    const { data } = await supabase
      .from('saved_recipes').select('*')
      .eq('user_id', user!.id).eq('source', 'web_import')
      .order('created_at', { ascending: false })
    setImports((data as SavedRecipe[]) ?? [])
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault()
    setExtracting(true)
    setError('')
    setExtracted(null)

    const { data, error: fnError } = await supabase.functions.invoke('ai-extract-recipe', {
      body: { text: pastedText.trim(), url: url.trim() || undefined, pantry_items: Array.from(pantryNames) },
    })
    setExtracting(false)

    if (fnError || !data) { setError('Could not reach the extraction service. Try again.'); return }
    if (data.error) { setError(data.error); return }

    setExtracted(data as ExtractedRecipe)
    setExtractedUrl(url.trim())
    setShowPreview(true)
  }

  return (
    <div className="flex flex-col h-full bg-cream-100 dark:bg-charcoal-900">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-800 text-2xl text-stone-800 dark:text-stone-100">Recipe Inbox</h1>
        <p className="text-sm font-body text-stone-400 dark:text-stone-500 mt-0.5">Copy recipe text from anywhere and save it</p>
      </div>

      <div className="px-4 pb-4">
        <form onSubmit={handleExtract} className="flex flex-col gap-2">
          <p className="text-xs font-body text-stone-400 dark:text-stone-500 px-0.5">
            Works with YouTube descriptions, Instagram captions, recipe blogs — copy the text and paste below
          </p>
          <textarea
            value={pastedText}
            onChange={e => { setPastedText(e.target.value); setError('') }}
            placeholder="Paste recipe text here — ingredients, steps, anything…"
            rows={6}
            className="input-field font-body text-sm resize-none leading-relaxed"
            disabled={extracting}
          />
          <div className="relative">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Source URL (optional)"
              className="input-field font-body text-sm pr-16"
              disabled={extracting}
              autoComplete="off"
              autoCapitalize="none"
            />
            <button type="button"
              onClick={async () => {
                try { const t = await navigator.clipboard.readText(); setUrl(t.trim()) } catch { /* ignore */ }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-display font-600 text-brand-500 dark:text-brand-400 hover:text-brand-600">
              Paste
            </button>
          </div>

          {error && <p className="text-xs font-body text-red-500 dark:text-red-400 px-1">{error}</p>}

          <button type="submit" disabled={extracting || pastedText.trim().length < 20}
            className="btn-primary py-3 font-display font-700 text-sm rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2">
            {extracting ? <><CookingSpinner size="sm" /><span>Extracting…</span></> : '✨ Extract Recipe'}
          </button>
        </form>

        {extracted && !showPreview && (
          <button onClick={() => setShowPreview(true)}
            className="mt-2 w-full py-2.5 rounded-2xl border border-brand-200 dark:border-brand-800 text-sm font-display font-600 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            View: {extracted.title}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {imports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-6">
            <span className="text-4xl">🌐</span>
            <p className="text-sm font-body text-stone-400 dark:text-stone-500">Recipes you import will appear here</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-display font-600 text-stone-400 dark:text-stone-500 mb-3">{imports.length} imported</p>
            <div className="space-y-2">
              {imports.map(r => <ImportedRecipeCard key={r.id} recipe={r} onView={() => setViewingRecipe(r)} />)}
            </div>
          </>
        )}
      </div>

      {showPreview && extracted && (
        <RecipePreviewSheet
          recipe={extracted} url={extractedUrl}
          onSave={() => { fetchImports(); setUrl(''); setPastedText('') }}
          onClose={() => setShowPreview(false)}
        />
      )}

      {viewingRecipe && (
        <RecipePreviewSheet
          recipe={{
            title: viewingRecipe.title,
            description: viewingRecipe.description ?? '',
            cuisine_type: viewingRecipe.cuisine_type ?? '',
            region_detail: viewingRecipe.region_detail ?? null,
            difficulty: viewingRecipe.difficulty,
            time_minutes: viewingRecipe.time_minutes ?? 0,
            ingredients: (viewingRecipe.ingredients ?? []).map(i => ({ name: i.name, quantity: i.quantity, in_pantry: i.in_pantry })),
            instructions: viewingRecipe.instructions ?? [],
            why_this: viewingRecipe.why_this ?? '',
          }}
          url={viewingRecipe.source_url ?? ''}
          onSave={() => {}}
          onClose={() => setViewingRecipe(null)}
        />
      )}
    </div>
  )
}
