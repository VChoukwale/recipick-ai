import type { AiRecipe } from '../../types/database'

interface Props {
  recipe: AiRecipe
  saved: boolean
  onSave: () => void
  onClose: () => void
}

function MatchBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-orange-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-cream-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-display font-700 text-stone-600 dark:text-stone-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

const SKIP_MISSING = new Set(['water', 'warm water', 'cold water', 'hot water', 'water (for boiling)'])

export default function RecipeDetailSheet({ recipe, saved, onSave, onClose }: Props) {
  const inPantry = recipe.ingredients.filter(i => i.in_pantry)
  const rawMissing = recipe.missing_ingredients?.length > 0
    ? recipe.missing_ingredients
    : recipe.ingredients.filter(i => !i.in_pantry).map(i => ({ name: i.name, substitution: '' }))
  const missing = rawMissing.filter(m => !SKIP_MISSING.has(m.name.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white dark:bg-charcoal-800 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 dark:bg-charcoal-600 rounded-full" />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pt-2 mb-2">
            <h2 className="font-display font-800 text-xl text-stone-800 dark:text-stone-100 leading-snug flex-1">
              {recipe.title}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none mt-1 flex-shrink-0">✕</button>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-body">
              {recipe.cuisine}
            </span>
            {recipe.region_detail && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 dark:bg-charcoal-700 text-stone-500 dark:text-stone-400 font-body">
                {recipe.region_detail}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 dark:bg-charcoal-700 text-stone-500 dark:text-stone-400 font-body">
              ⏱ {recipe.time_minutes} min
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-body capitalize
              ${recipe.difficulty === 'easy' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : recipe.difficulty === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
              {recipe.difficulty}
            </span>
          </div>

          {/* Match bar */}
          <div className="mb-3">
            <p className="text-xs text-stone-400 dark:text-stone-500 font-body mb-1.5">Pantry match</p>
            <MatchBar pct={recipe.match_percentage} />
            {missing.length > 0 ? (
              <p className="text-xs font-body text-orange-500 dark:text-orange-400 mt-1.5">
                To reach 100%: add {missing.map(m => m.name).join(', ')}
              </p>
            ) : recipe.match_percentage < 100 ? (
              <p className="text-xs font-body text-orange-400 dark:text-orange-500 mt-1.5">
                A small number of ingredients may not be in your pantry
              </p>
            ) : null}
          </div>

          {/* Why this */}
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl px-4 py-3 mb-5">
            <p className="text-sm font-body italic text-brand-700 dark:text-brand-300 leading-relaxed">
              "{recipe.why_this}"
            </p>
          </div>

          {/* In pantry */}
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

          {/* Missing — uses missing_ingredients directly */}
          {missing.length > 0 && (
            <div className="mb-5">
              <h3 className="font-display font-700 text-sm text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <span className="text-orange-400">+</span> You'll need ({missing.length})
              </h3>
              <div className="space-y-2">
                {missing.map((m, i) => (
                  <div key={i} className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm text-stone-700 dark:text-stone-300">{m.name}</span>
                    </div>
                    {m.substitution && (
                      <p className="text-xs font-body text-orange-500 dark:text-orange-400 mt-0.5">
                        Sub: {m.substitution}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4">
            <h3 className="font-display font-700 text-sm text-stone-500 dark:text-stone-400 mb-3">Instructions</h3>
            <div className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 text-xs font-display font-700 flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-body text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-cream-100 dark:border-charcoal-700/50">
          <button
            onClick={onSave}
            disabled={saved}
            className={`w-full py-3 rounded-2xl font-display font-700 text-sm transition-all
              ${saved
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'btn-primary'
              }`}
          >
            {saved ? '✓ Saved to Recipe Vault' : 'Save to Recipe Vault'}
          </button>
        </div>
      </div>
    </div>
  )
}
