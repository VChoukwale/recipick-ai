import type { AiRecipe, RecipeIngredient } from '../types/database'
import { violatesDiet } from './diet'

type MissingIngredient = { name: string; substitution: string }

export const WATER_VARIANTS = new Set([
  'water', 'warm water', 'cold water', 'hot water', 'boiling water',
  'lukewarm water', 'ice water', 'salted water',
])

export function computeMatchPercentage(ingredients: RecipeIngredient[]): number {
  const countable = ingredients.filter(i => !WATER_VARIANTS.has(i.name.toLowerCase()))
  if (countable.length === 0) return 100
  const inPantry = countable.filter(i => i.in_pantry).length
  return Math.round((inPantry / countable.length) * 100)
}

export function computeMissingIngredients(
  ingredients: RecipeIngredient[],
  existingMissing: MissingIngredient[],
): MissingIngredient[] {
  const substitutionMap = new Map(existingMissing.map(m => [m.name.toLowerCase(), m.substitution]))
  return ingredients
    .filter(i => !i.in_pantry && !WATER_VARIANTS.has(i.name.toLowerCase()))
    .map(i => ({
      name: i.name,
      substitution: substitutionMap.get(i.name.toLowerCase()) ?? '',
    }))
}

export function deduplicateByTitle(recipes: AiRecipe[]): AiRecipe[] {
  const seen = new Set<string>()
  return recipes.filter(r => {
    const key = r.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface EnrichedRecipe extends AiRecipe {
  match_percentage: number
  missing_ingredients: MissingIngredient[]
}

export function validateAndEnrichRecipe(recipe: AiRecipe, diet: string): EnrichedRecipe | null {
  if (!recipe.instructions || recipe.instructions.length === 0) return null
  if (diet !== 'non_vegetarian') {
    const hasViolation = (recipe.ingredients ?? []).some(i => violatesDiet(i.name, diet))
    if (hasViolation) return null
  }
  return {
    ...recipe,
    match_percentage: computeMatchPercentage(recipe.ingredients ?? []),
    missing_ingredients: computeMissingIngredients(recipe.ingredients ?? [], recipe.missing_ingredients ?? []),
  }
}
