import { RecipeSchema, type Recipe, type MissingIngredient } from './recipeSchema.ts'

// Mirrors src/utils/diet.ts — intentional duplication for Deno edge runtime.
const MEAT_FISH = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'fish', 'prawn',
  'shrimp', 'tuna', 'salmon', 'crab', 'lobster', 'turkey', 'duck', 'bacon',
  'ham', 'sausage', 'anchovy', 'sardine', 'squid', 'mince', 'keema',
  'pepperoni', 'salami',
]
const DAIRY_KEYWORDS = [
  'milk', 'butter', 'cheese', 'cream', 'yogurt', 'curd', 'dahi', 'ghee',
  'paneer', 'whey', 'honey', 'cheddar', 'mozzarella', 'parmesan', 'ricotta',
  'feta', 'halloumi', 'khoya', 'malai', 'condensed milk',
]
const PLANT_BASED_MARKERS = [
  'plant based', 'plant-based', 'plant protein', 'vegan', 'mock ', 'faux ',
  'beyond meat', 'impossible burger', 'tofu', 'tempeh', 'seitan', 'jackfruit',
]
const SPICE_INDICATORS = [
  'masala', 'spice mix', 'spice blend', 'spice rub', 'seasoning',
  'curry powder', 'marinade', 'tadka', 'tempering',
]

const WATER_VARIANTS = new Set([
  'water', 'warm water', 'cold water', 'hot water', 'boiling water',
  'lukewarm water', 'ice water', 'salted water',
])

function isPlantBased(lower: string): boolean {
  return PLANT_BASED_MARKERS.some(m => lower.includes(m))
}

function isSpiceProduct(lower: string): boolean {
  return SPICE_INDICATORS.some(s => lower.includes(s))
}

function hasEggInName(name: string): boolean {
  return /\beggs?\b/i.test(name)
}

function violatesDiet(name: string, diet: string): boolean {
  const lower = name.toLowerCase()
  if (isPlantBased(lower)) return false
  const spice = isSpiceProduct(lower)
  const isMeatFish = !spice && MEAT_FISH.some(k => lower.includes(k))
  const isDairy = DAIRY_KEYWORDS.some(k => lower.includes(k))
  const isEgg = hasEggInName(lower)
  if (diet === 'vegan') return isMeatFish || isDairy || isEgg
  if (diet === 'vegetarian') return isMeatFish || isEgg
  if (diet === 'vegetarian_with_eggs') return isMeatFish
  return false
}

function computeMatchPercentage(ingredients: Recipe['ingredients']): number {
  const countable = ingredients.filter(i => !WATER_VARIANTS.has(i.name.toLowerCase()))
  if (countable.length === 0) return 100
  const inPantry = countable.filter(i => i.in_pantry).length
  return Math.round((inPantry / countable.length) * 100)
}

function computeMissingIngredients(
  ingredients: Recipe['ingredients'],
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

export interface ValidationResult {
  valid: Recipe[]
  droppedCount: number
}

/**
 * Parses, validates, and enriches a raw AI recipes array.
 * - Drops recipes that fail Zod schema validation.
 * - Drops recipes with empty instructions.
 * - Drops recipes where any ingredient violates the user's diet.
 * - Recomputes match_percentage and missing_ingredients from in_pantry booleans.
 * - Deduplicates by title (case-insensitive, first occurrence wins).
 */
export function validateAndEnrichRecipes(
  rawRecipes: unknown[],
  diet: string,
): ValidationResult {
  let droppedCount = 0
  const seen = new Set<string>()
  const valid: Recipe[] = []

  for (const raw of rawRecipes) {
    const parsed = RecipeSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('[ai-chef] recipe schema validation failed:', parsed.error.issues)
      droppedCount++
      continue
    }

    const recipe = parsed.data

    if (recipe.instructions.length === 0) {
      console.error('[ai-chef] recipe dropped: empty instructions —', recipe.title)
      droppedCount++
      continue
    }

    const violating = diet !== 'non_vegetarian'
      ? recipe.ingredients.filter(i => violatesDiet(i.name, diet))
      : []
    if (violating.length > 0) {
      console.error('[ai-chef] recipe dropped: diet violation in', recipe.title, '—', violating.map(i => i.name))
      droppedCount++
      continue
    }

    const titleKey = recipe.title.toLowerCase().trim()
    if (seen.has(titleKey)) {
      droppedCount++
      continue
    }
    seen.add(titleKey)

    valid.push({
      ...recipe,
      match_percentage: computeMatchPercentage(recipe.ingredients),
      missing_ingredients: computeMissingIngredients(recipe.ingredients, recipe.missing_ingredients),
    })
  }

  return { valid, droppedCount }
}
