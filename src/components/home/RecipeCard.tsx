import type { AiRecipe } from '../../types/database'
import { detectAllergens } from '../../utils/allergens'

interface Props {
  recipe: AiRecipe
  saved: boolean
  onView: () => void
  onSave: () => void
  userAllergies?: string[]
}

function MatchBadge({ pct }: { pct: number }) {
  const style =
    pct >= 90
      ? { background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)', color: '#065f46' }
      : pct >= 75
      ? { background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)', color: '#78350f' }
      : { background: 'linear-gradient(135deg, #ffedd5 0%, #fdba74 100%)', color: '#9a3412' }
  return (
    <span
      className="text-[11px] font-display font-700 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
      style={style}
    >
      {pct}% match
    </span>
  )
}

const SKIP_MISSING = new Set(['water', 'warm water', 'cold water', 'hot water', 'water (for boiling)'])

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   '#16a34a',
  medium: '#d97706',
  hard:   '#dc2626',
}

export default function RecipeCard({ recipe, saved, onView, onSave, userAllergies = [] }: Props) {
  const inPantryCount = recipe.ingredients.filter(i => i.in_pantry).length
  const allergenWarnings = detectAllergens(recipe.ingredients, userAllergies)
  const rawMissing = recipe.missing_ingredients?.length > 0
    ? recipe.missing_ingredients
    : recipe.ingredients.filter(i => !i.in_pantry).map(i => ({ name: i.name, substitution: '' }))
  const missing = rawMissing.filter(m => !SKIP_MISSING.has(m.name.toLowerCase()))
  const missingCount = missing.length

  return (
    <div
      className="overflow-hidden rounded-[18px] transition-all duration-200 hover:-translate-y-[2px] cursor-default"
      style={{
        background: 'var(--s2)',
        border: '1px solid var(--bdr-s)',
        boxShadow: 'var(--shd-md)',
      }}
    >
      {/* Accent stripe — featured editorial touch */}
      <div
        className="h-[3px] w-full"
        style={{ background: 'linear-gradient(90deg, #E8713A 0%, #F5A860 55%, transparent 100%)' }}
      />

      <div className="px-4 pt-3.5 pb-3">
        {/* Title row */}
        <div className="flex items-start gap-2 mb-2">
          <h3
            className="font-display font-700 text-[15px] leading-snug flex-1"
            style={{ color: 'var(--t1)' }}
          >
            {recipe.title}
          </h3>
          <MatchBadge pct={recipe.match_percentage} />
        </div>

        {/* Cuisine + time + difficulty */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="text-[11px] font-body px-2.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(232,113,58,0.08)',
              border: '1px solid rgba(232,113,58,0.14)',
              color: '#E8713A',
            }}
          >
            {recipe.cuisine}{recipe.region_detail ? ` · ${recipe.region_detail}` : ''}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
            ⏱ {recipe.time_minutes} min
          </span>
          <span
            className="text-[11px] font-display font-600 capitalize"
            style={{ color: DIFFICULTY_COLOR[recipe.difficulty] ?? 'var(--t3)' }}
          >
            {recipe.difficulty}
          </span>
        </div>

        {/* Why this — bullet points */}
        <div
          className="rounded-xl px-3 py-2.5 mb-3"
          style={{
            background: 'rgba(232,113,58,0.05)',
            border: '1px solid rgba(232,113,58,0.08)',
          }}
        >
          {recipe.why_this.includes('\n') ? (
            <ul className="space-y-0.5">
              {recipe.why_this.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] font-body leading-snug" style={{ color: 'var(--t2)' }}>
                  <span style={{ color: '#E8713A', flexShrink: 0, marginTop: 1 }}>•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] font-body italic leading-relaxed" style={{ color: 'var(--t2)' }}>
              "{recipe.why_this}"
            </p>
          )}
        </div>

        {/* Ingredient summary */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span style={{ color: '#16a34a' }}>✓ {inPantryCount} in pantry</span>
          {missingCount > 0 ? (
            <span style={{ color: '#d97706' }}>+ {missingCount} needed: {missing.map(m => m.name).join(', ')}</span>
          ) : recipe.match_percentage < 100 ? (
            <span style={{ color: 'var(--t3)' }}>a few items missing</span>
          ) : null}
        </div>

        {/* Allergen warning */}
        {allergenWarnings.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <span className="text-sm flex-shrink-0">⚠️</span>
            <span className="text-[11px] font-display font-700 text-red-600">
              Contains: {allergenWarnings.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ borderTop: '1px solid var(--bdr-s)' }} className="flex">
        <button
          onClick={onView}
          className="flex-1 py-2.5 text-[13px] font-display font-700 transition-colors duration-150 hover:opacity-80 active:scale-[0.98]"
          style={{ color: '#E8713A' }}
        >
          See Recipe →
        </button>
        <div style={{ width: 1, background: 'var(--bdr-s)' }} />
        <button
          onClick={onSave}
          disabled={saved}
          className="flex-1 py-2.5 text-[13px] font-display font-600 transition-colors duration-150 hover:opacity-80 active:scale-[0.98]"
          style={{ color: saved ? '#16a34a' : 'var(--t3)' }}
        >
          {saved ? '✓ Saved' : '⊕ Save'}
        </button>
      </div>
    </div>
  )
}
