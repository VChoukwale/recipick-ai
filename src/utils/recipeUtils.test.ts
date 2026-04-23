import { describe, it, expect } from 'vitest'
import {
  WATER_VARIANTS,
  computeMatchPercentage,
  computeMissingIngredients,
  deduplicateByTitle,
  validateAndEnrichRecipe,
} from './recipeUtils'
import type { AiRecipe, RecipeIngredient } from '../types/database'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ing(name: string, in_pantry: boolean): RecipeIngredient {
  return { name, quantity: '1 cup', in_pantry }
}

function baseRecipe(overrides: Partial<AiRecipe> = {}): AiRecipe {
  return {
    title: 'Test Recipe',
    description: 'A test dish',
    cuisine: 'Test',
    region_detail: null,
    difficulty: 'easy',
    time_minutes: 20,
    ingredients: [ing('tomato', true), ing('onion', true)],
    missing_ingredients: [],
    match_percentage: 100,
    instructions: ['Step 1', 'Step 2'],
    why_this: 'Quick\nHealthy\nTasty',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// WATER_VARIANTS
// ---------------------------------------------------------------------------
describe('WATER_VARIANTS', () => {
  it('contains "water"', () => expect(WATER_VARIANTS.has('water')).toBe(true))
  it('contains "warm water"', () => expect(WATER_VARIANTS.has('warm water')).toBe(true))
  it('contains "boiling water"', () => expect(WATER_VARIANTS.has('boiling water')).toBe(true))
  it('does not contain "coconut water"', () => expect(WATER_VARIANTS.has('coconut water')).toBe(false))
})

// ---------------------------------------------------------------------------
// computeMatchPercentage
// ---------------------------------------------------------------------------
describe('computeMatchPercentage', () => {
  it('returns 100 when all ingredients are in pantry', () => {
    expect(computeMatchPercentage([ing('rice', true), ing('tomato', true)])).toBe(100)
  })

  it('returns 50 when half are in pantry', () => {
    expect(computeMatchPercentage([ing('rice', true), ing('saffron', false)])).toBe(50)
  })

  it('returns 0 when none are in pantry', () => {
    expect(computeMatchPercentage([ing('truffles', false)])).toBe(0)
  })

  it('excludes water variants from the count', () => {
    // 1 in pantry, 1 not, water excluded → 50%
    expect(computeMatchPercentage([ing('rice', true), ing('saffron', false), ing('water', false)])).toBe(50)
  })

  it('excludes "warm water" from the count', () => {
    expect(computeMatchPercentage([ing('rice', true), ing('warm water', false)])).toBe(100)
  })

  it('returns 100 for empty ingredient list', () => {
    expect(computeMatchPercentage([])).toBe(100)
  })

  it('returns 100 when only water variants are listed', () => {
    expect(computeMatchPercentage([ing('water', false), ing('hot water', false)])).toBe(100)
  })

  it('rounds to nearest integer', () => {
    // 2 of 3 in pantry → 66.67% → rounds to 67
    expect(computeMatchPercentage([ing('a', true), ing('b', true), ing('c', false)])).toBe(67)
  })
})

// ---------------------------------------------------------------------------
// computeMissingIngredients
// ---------------------------------------------------------------------------
describe('computeMissingIngredients', () => {
  it('returns missing ingredients not in pantry', () => {
    const result = computeMissingIngredients(
      [ing('rice', true), ing('saffron', false)],
      [{ name: 'saffron', substitution: 'turmeric' }],
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('saffron')
    expect(result[0].substitution).toBe('turmeric')
  })

  it('excludes water variants from missing list', () => {
    const result = computeMissingIngredients(
      [ing('saffron', false), ing('water', false)],
      [],
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('saffron')
  })

  it('preserves substitution from AI even when AI name casing differs', () => {
    const result = computeMissingIngredients(
      [ing('Saffron', false)],
      [{ name: 'saffron', substitution: 'turmeric' }],
    )
    expect(result[0].substitution).toBe('turmeric')
  })

  it('returns empty substitution when AI gave none', () => {
    const result = computeMissingIngredients([ing('saffron', false)], [])
    expect(result[0].substitution).toBe('')
  })

  it('returns empty array when all are in pantry', () => {
    expect(computeMissingIngredients([ing('rice', true), ing('tomato', true)], [])).toHaveLength(0)
  })

  it('returns empty array for empty ingredients', () => {
    expect(computeMissingIngredients([], [])).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// deduplicateByTitle
// ---------------------------------------------------------------------------
describe('deduplicateByTitle', () => {
  it('removes duplicate titles (case-insensitive)', () => {
    const recipes = [
      baseRecipe({ title: 'Dal Tadka' }),
      baseRecipe({ title: 'dal tadka' }),
      baseRecipe({ title: 'Aloo Gobi' }),
    ]
    const result = deduplicateByTitle(recipes)
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Dal Tadka')
    expect(result[1].title).toBe('Aloo Gobi')
  })

  it('keeps first occurrence', () => {
    const recipes = [
      baseRecipe({ title: 'Rice Bowl', description: 'first' }),
      baseRecipe({ title: 'Rice Bowl', description: 'second' }),
    ]
    expect(deduplicateByTitle(recipes)[0].description).toBe('first')
  })

  it('returns empty array for empty input', () => {
    expect(deduplicateByTitle([])).toHaveLength(0)
  })

  it('trims whitespace before comparing', () => {
    const recipes = [
      baseRecipe({ title: ' Dal Tadka ' }),
      baseRecipe({ title: 'dal tadka' }),
    ]
    expect(deduplicateByTitle(recipes)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// validateAndEnrichRecipe
// ---------------------------------------------------------------------------
describe('validateAndEnrichRecipe — valid recipes', () => {
  it('returns enriched recipe for a fully valid input', () => {
    const recipe = baseRecipe({
      ingredients: [ing('rice', true), ing('saffron', false)],
      missing_ingredients: [{ name: 'saffron', substitution: 'turmeric' }],
    })
    const result = validateAndEnrichRecipe(recipe, 'vegetarian')
    expect(result).not.toBeNull()
    expect(result!.match_percentage).toBe(50)
    expect(result!.missing_ingredients).toHaveLength(1)
    expect(result!.missing_ingredients[0].name).toBe('saffron')
  })

  it('recomputes match_percentage even if AI sent wrong value', () => {
    const recipe = baseRecipe({
      ingredients: [ing('rice', true), ing('saffron', false)],
      match_percentage: 99,
    })
    const result = validateAndEnrichRecipe(recipe, 'vegetarian')
    expect(result!.match_percentage).toBe(50)
  })

  it('non_vegetarian diet accepts meat ingredients', () => {
    const recipe = baseRecipe({ ingredients: [ing('chicken', true)] })
    expect(validateAndEnrichRecipe(recipe, 'non_vegetarian')).not.toBeNull()
  })

  it('passes for vegan recipe with plant-based ingredients', () => {
    const recipe = baseRecipe({ ingredients: [ing('tofu', true), ing('rice', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegan')).not.toBeNull()
  })

  it('water excluded from match and missing', () => {
    const recipe = baseRecipe({
      ingredients: [ing('rice', true), ing('water', false)],
      missing_ingredients: [],
    })
    const result = validateAndEnrichRecipe(recipe, 'vegetarian')
    expect(result!.match_percentage).toBe(100)
    expect(result!.missing_ingredients).toHaveLength(0)
  })
})

describe('validateAndEnrichRecipe — diet violations', () => {
  it('returns null when vegetarian recipe contains chicken', () => {
    const recipe = baseRecipe({ ingredients: [ing('tomato', true), ing('chicken', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).toBeNull()
  })

  it('returns null when vegan recipe contains paneer', () => {
    const recipe = baseRecipe({ ingredients: [ing('paneer', true), ing('rice', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegan')).toBeNull()
  })

  it('returns null when vegan recipe contains eggs', () => {
    const recipe = baseRecipe({ ingredients: [ing('eggs', true), ing('rice', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegan')).toBeNull()
  })

  it('returns null when vegetarian_with_eggs recipe contains fish', () => {
    const recipe = baseRecipe({ ingredients: [ing('fish', true), ing('rice', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian_with_eggs')).toBeNull()
  })

  it('spice exception: "fish curry masala" does not cause violation', () => {
    const recipe = baseRecipe({ ingredients: [ing('fish curry masala', true), ing('rice', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).not.toBeNull()
  })

  it('plant-based exception: "vegan chicken strips" does not cause violation', () => {
    const recipe = baseRecipe({ ingredients: [ing('vegan chicken strips', true)] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).not.toBeNull()
  })
})

describe('validateAndEnrichRecipe — structural checks', () => {
  it('returns null for empty instructions', () => {
    const recipe = baseRecipe({ instructions: [] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).toBeNull()
  })

  it('passes with single instruction', () => {
    const recipe = baseRecipe({ instructions: ['Combine and serve'] })
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).not.toBeNull()
  })

  it('handles undefined missing_ingredients gracefully', () => {
    const recipe = { ...baseRecipe(), missing_ingredients: undefined as unknown as [] }
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).not.toBeNull()
  })

  it('handles undefined ingredients gracefully', () => {
    const recipe = { ...baseRecipe(), ingredients: undefined as unknown as [] }
    expect(validateAndEnrichRecipe(recipe, 'vegetarian')).not.toBeNull()
  })
})
