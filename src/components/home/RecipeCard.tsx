import type { AiRecipe } from '../../types/database'

interface Props {
  recipe: AiRecipe
  saved: boolean
  onView: () => void
  onSave: () => void
}

function MatchBadge({ pct }: { pct: number }) {
  const cls = pct >= 90
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    : pct >= 75
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
  return (
    <span className={`text-xs font-display font-700 px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {pct}% match
    </span>
  )
}

const SKIP_MISSING = new Set(['water', 'warm water', 'cold water', 'hot water', 'water (for boiling)'])

export default function RecipeCard({ recipe, saved, onView, onSave }: Props) {
  const inPantryCount = recipe.ingredients.filter(i => i.in_pantry).length
  // Use missing_ingredients array; fallback to ingredients marked not in pantry
  const rawMissing = recipe.missing_ingredients?.length > 0
    ? recipe.missing_ingredients
    : recipe.ingredients.filter(i => !i.in_pantry).map(i => ({ name: i.name, substitution: '' }))
  const missing = rawMissing.filter(m => !SKIP_MISSING.has(m.name.toLowerCase()))
  const missingCount = missing.length

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-md border border-cream-200 dark:border-charcoal-700 overflow-hidden hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      <div className="px-4 pt-4 pb-3">
        {/* Title + match */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display font-700 text-base text-stone-800 dark:text-stone-100 leading-snug flex-1">
            {recipe.title}
          </h3>
          <MatchBadge pct={recipe.match_percentage} />
        </div>

        {/* Cuisine tag */}
        <div className="mb-2">
          <span className="text-xs font-body px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {recipe.cuisine}{recipe.region_detail ? ` · ${recipe.region_detail}` : ''}
          </span>
        </div>

        {/* Time + difficulty */}
        <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500 mb-2.5">
          <span>⏱ {recipe.time_minutes} min</span>
          <span>·</span>
          <span className={`capitalize ${
            recipe.difficulty === 'easy' ? 'text-emerald-600 dark:text-emerald-400'
            : recipe.difficulty === 'medium' ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
          }`}>{recipe.difficulty}</span>
        </div>

        {/* Why this */}
        <p className="text-sm font-body italic text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
          "{recipe.why_this}"
        </p>

        {/* Ingredient summary */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">✓ {inPantryCount} in pantry</span>
            {missingCount > 0 ? (
              <>
                <span className="text-stone-300 dark:text-stone-600">·</span>
                <span className="text-orange-500 dark:text-orange-400">+ {missingCount} needed</span>
              </>
            ) : recipe.match_percentage < 100 ? (
              <>
                <span className="text-stone-300 dark:text-stone-600">·</span>
                <span className="text-orange-400 dark:text-orange-500">few items missing</span>
              </>
            ) : null}
          </div>
          {missingCount > 0 && (
            <p className="text-orange-400 dark:text-orange-500 font-body">
              Missing: {missing.map(m => m.name).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-cream-100 dark:border-charcoal-700/50">
        <button
          onClick={onView}
          className="flex-1 py-2.5 text-sm font-display font-600 text-brand-600 dark:text-brand-400 hover:bg-cream-50 dark:hover:bg-charcoal-700/50 transition-colors"
        >
          See Recipe →
        </button>
        <div className="w-px bg-cream-100 dark:bg-charcoal-700/50" />
        <button
          onClick={onSave}
          disabled={saved}
          className={`flex-1 py-2.5 text-sm font-display font-600 transition-colors
            ${saved
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-stone-400 dark:text-stone-500 hover:bg-cream-50 dark:hover:bg-charcoal-700/50'
            }`}
        >
          {saved ? '✓ Saved' : '⊕ Save'}
        </button>
      </div>
    </div>
  )
}
