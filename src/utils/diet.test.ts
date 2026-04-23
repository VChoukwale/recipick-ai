import { describe, it, expect } from 'vitest'
import {
  violatesDiet,
  dietLabel,
  hasEggInName,
  isPlantBased,
  isSpiceProduct,
  MEAT_FISH,
  DAIRY_KEYWORDS,
  PLANT_BASED_MARKERS,
  SPICE_INDICATORS,
} from './diet'

// ---------------------------------------------------------------------------
// hasEggInName
// ---------------------------------------------------------------------------
describe('hasEggInName', () => {
  it('matches "egg"', () => expect(hasEggInName('egg')).toBe(true))
  it('matches "eggs"', () => expect(hasEggInName('eggs')).toBe(true))
  it('matches "Eggs" (case insensitive)', () => expect(hasEggInName('Eggs')).toBe(true))
  it('matches "egg" inside a phrase', () => expect(hasEggInName('egg noodles')).toBe(true))
  it('does NOT match "eggplant" (no word boundary)', () => expect(hasEggInName('eggplant')).toBe(false))
  it('does NOT match "eggnog"', () => expect(hasEggInName('eggnog')).toBe(false))
  it('does NOT match empty string', () => expect(hasEggInName('')).toBe(false))
})

// ---------------------------------------------------------------------------
// isPlantBased
// ---------------------------------------------------------------------------
describe('isPlantBased', () => {
  it('matches "tofu"', () => expect(isPlantBased('tofu')).toBe(true))
  it('matches "tempeh"', () => expect(isPlantBased('tempeh')).toBe(true))
  it('matches "vegan chicken strips" (branded product)', () => expect(isPlantBased('vegan chicken strips')).toBe(true))
  it('matches "beyond meat"', () => expect(isPlantBased('beyond meat')).toBe(true))
  it('matches "plant-based beef"', () => expect(isPlantBased('plant-based beef')).toBe(true))
  it('matches "plant based mince"', () => expect(isPlantBased('plant based mince')).toBe(true))
  it('matches "seitan"', () => expect(isPlantBased('seitan')).toBe(true))
  it('matches "jackfruit"', () => expect(isPlantBased('jackfruit')).toBe(true))
  it('does NOT match regular chicken', () => expect(isPlantBased('chicken breast')).toBe(false))
  it('does NOT match paneer (dairy, not plant-based branded)', () => expect(isPlantBased('paneer')).toBe(false))
  // "mock " has trailing space — "mock chicken" has a space after "mock"
  it('matches "mock chicken"', () => expect(isPlantBased('mock chicken')).toBe(true))
  // "mock" at end of string does NOT match (trailing space required)
  it('does NOT match bare "mock" with no trailing space', () => expect(isPlantBased('mock')).toBe(false))
})

// ---------------------------------------------------------------------------
// isSpiceProduct
// ---------------------------------------------------------------------------
describe('isSpiceProduct', () => {
  it('matches "chicken tikka masala"', () => expect(isSpiceProduct('chicken tikka masala')).toBe(true))
  it('matches "fish curry masala"', () => expect(isSpiceProduct('fish curry masala')).toBe(true))
  it('matches "spice mix"', () => expect(isSpiceProduct('spice mix')).toBe(true))
  it('matches "spice blend"', () => expect(isSpiceProduct('spice blend')).toBe(true))
  it('matches "seasoning"', () => expect(isSpiceProduct('seasoning')).toBe(true))
  it('matches "curry powder"', () => expect(isSpiceProduct('curry powder')).toBe(true))
  it('matches "tadka"', () => expect(isSpiceProduct('tadka')).toBe(true))
  it('matches "tempering"', () => expect(isSpiceProduct('tempering')).toBe(true))
  it('does NOT match plain "chicken"', () => expect(isSpiceProduct('chicken')).toBe(false))
  it('does NOT match "fish fillet"', () => expect(isSpiceProduct('fish fillet')).toBe(false))
})

// ---------------------------------------------------------------------------
// violatesDiet — vegan
// ---------------------------------------------------------------------------
describe('violatesDiet — vegan', () => {
  it('meat: chicken violates', () => expect(violatesDiet('chicken', 'vegan')).toBe(true))
  it('meat: salmon violates', () => expect(violatesDiet('salmon', 'vegan')).toBe(true))
  it('meat: keema violates', () => expect(violatesDiet('keema', 'vegan')).toBe(true))
  it('dairy: milk violates', () => expect(violatesDiet('milk', 'vegan')).toBe(true))
  it('dairy: paneer violates', () => expect(violatesDiet('paneer', 'vegan')).toBe(true))
  it('dairy: ghee violates', () => expect(violatesDiet('ghee', 'vegan')).toBe(true))
  it('dairy: honey violates', () => expect(violatesDiet('honey', 'vegan')).toBe(true))
  it('egg: "egg" violates', () => expect(violatesDiet('egg', 'vegan')).toBe(true))
  it('egg: "eggs" violates', () => expect(violatesDiet('eggs', 'vegan')).toBe(true))
  it('egg: "egg whites" violates', () => expect(violatesDiet('egg whites', 'vegan')).toBe(true))

  // Plant-based exceptions — never violate any diet
  it('plant-based: tofu does not violate', () => expect(violatesDiet('tofu', 'vegan')).toBe(false))
  it('plant-based: "vegan chicken strips" does not violate', () => expect(violatesDiet('vegan chicken strips', 'vegan')).toBe(false))
  it('plant-based: tempeh does not violate', () => expect(violatesDiet('tempeh', 'vegan')).toBe(false))
  it('plant-based: jackfruit does not violate', () => expect(violatesDiet('jackfruit', 'vegan')).toBe(false))

  // Spice exceptions
  it('spice: "fish curry masala" does not violate (spice packet)', () => expect(violatesDiet('Fish Curry Masala', 'vegan')).toBe(false))
  it('spice: "chicken tikka masala powder" does not violate', () => expect(violatesDiet('Chicken Tikka Masala Powder', 'vegan')).toBe(false))

  // Safe plant foods
  it('tomatoes do not violate', () => expect(violatesDiet('tomatoes', 'vegan')).toBe(false))
  it('eggplant does not violate (no word boundary match)', () => expect(violatesDiet('eggplant', 'vegan')).toBe(false))
  it('rice does not violate', () => expect(violatesDiet('rice', 'vegan')).toBe(false))

  // Case insensitivity
  it('handles mixed case: "Chicken Breast"', () => expect(violatesDiet('Chicken Breast', 'vegan')).toBe(true))
  it('handles all caps: "PANEER"', () => expect(violatesDiet('PANEER', 'vegan')).toBe(true))

  // Known false positive — documented limitation
  it('known limitation: "coconut milk" is flagged (contains "milk")', () => expect(violatesDiet('coconut milk', 'vegan')).toBe(true))
})

// ---------------------------------------------------------------------------
// violatesDiet — vegetarian
// ---------------------------------------------------------------------------
describe('violatesDiet — vegetarian', () => {
  it('meat: chicken violates', () => expect(violatesDiet('chicken', 'vegetarian')).toBe(true))
  it('meat: beef violates', () => expect(violatesDiet('beef', 'vegetarian')).toBe(true))
  it('egg: eggs violate', () => expect(violatesDiet('eggs', 'vegetarian')).toBe(true))

  // Dairy is OK for vegetarian
  it('dairy: paneer does not violate', () => expect(violatesDiet('paneer', 'vegetarian')).toBe(false))
  it('dairy: butter does not violate', () => expect(violatesDiet('butter', 'vegetarian')).toBe(false))
  it('dairy: ghee does not violate', () => expect(violatesDiet('ghee', 'vegetarian')).toBe(false))
  it('dairy: milk does not violate', () => expect(violatesDiet('milk', 'vegetarian')).toBe(false))

  // Plant-based exceptions
  it('tofu does not violate', () => expect(violatesDiet('tofu', 'vegetarian')).toBe(false))

  // Spice exceptions
  it('"chicken curry masala" does not violate (spice)', () => expect(violatesDiet('chicken curry masala', 'vegetarian')).toBe(false))

  // Edge case: eggplant
  it('eggplant does not violate', () => expect(violatesDiet('eggplant', 'vegetarian')).toBe(false))
})

// ---------------------------------------------------------------------------
// violatesDiet — vegetarian_with_eggs (eggitarian)
// ---------------------------------------------------------------------------
describe('violatesDiet — vegetarian_with_eggs', () => {
  it('meat: chicken violates', () => expect(violatesDiet('chicken', 'vegetarian_with_eggs')).toBe(true))
  it('meat: fish violates', () => expect(violatesDiet('fish', 'vegetarian_with_eggs')).toBe(true))

  // Eggs are OK
  it('eggs do not violate', () => expect(violatesDiet('eggs', 'vegetarian_with_eggs')).toBe(false))
  it('"egg whites" do not violate', () => expect(violatesDiet('egg whites', 'vegetarian_with_eggs')).toBe(false))

  // Dairy is OK
  it('paneer does not violate', () => expect(violatesDiet('paneer', 'vegetarian_with_eggs')).toBe(false))
  it('ghee does not violate', () => expect(violatesDiet('ghee', 'vegetarian_with_eggs')).toBe(false))

  // Spice exception still applies
  it('"beef masala" does not violate (spice)', () => expect(violatesDiet('beef masala', 'vegetarian_with_eggs')).toBe(false))
})

// ---------------------------------------------------------------------------
// violatesDiet — non_vegetarian
// ---------------------------------------------------------------------------
describe('violatesDiet — non_vegetarian', () => {
  it('chicken does not violate', () => expect(violatesDiet('chicken', 'non_vegetarian')).toBe(false))
  it('beef does not violate', () => expect(violatesDiet('beef', 'non_vegetarian')).toBe(false))
  it('eggs do not violate', () => expect(violatesDiet('eggs', 'non_vegetarian')).toBe(false))
  it('milk does not violate', () => expect(violatesDiet('milk', 'non_vegetarian')).toBe(false))
  it('fish does not violate', () => expect(violatesDiet('fish', 'non_vegetarian')).toBe(false))
})

// ---------------------------------------------------------------------------
// violatesDiet — unknown/empty diet
// ---------------------------------------------------------------------------
describe('violatesDiet — unknown diet string', () => {
  it('returns false for empty string diet', () => expect(violatesDiet('chicken', '')).toBe(false))
  it('returns false for unrecognised diet value', () => expect(violatesDiet('beef', 'flexitarian')).toBe(false))
})

// ---------------------------------------------------------------------------
// dietLabel
// ---------------------------------------------------------------------------
describe('dietLabel', () => {
  it('returns "vegan" for vegan', () => expect(dietLabel('vegan')).toBe('vegan'))
  it('returns "vegetarian (no eggs)" for vegetarian', () => expect(dietLabel('vegetarian')).toBe('vegetarian (no eggs)'))
  it('returns "eggitarian" for vegetarian_with_eggs', () => expect(dietLabel('vegetarian_with_eggs')).toBe('eggitarian'))
  it('returns empty string for non_vegetarian', () => expect(dietLabel('non_vegetarian')).toBe(''))
  it('returns empty string for unknown value', () => expect(dietLabel('unknown')).toBe(''))
})

// ---------------------------------------------------------------------------
// Keyword set integrity — guard against accidental edits
// ---------------------------------------------------------------------------
describe('keyword set integrity', () => {
  it('MEAT_FISH contains expected entries', () => {
    expect(MEAT_FISH).toContain('chicken')
    expect(MEAT_FISH).toContain('fish')
    expect(MEAT_FISH).toContain('keema')
    expect(MEAT_FISH).toContain('salami')
  })
  it('DAIRY_KEYWORDS contains expected entries', () => {
    expect(DAIRY_KEYWORDS).toContain('paneer')
    expect(DAIRY_KEYWORDS).toContain('ghee')
    expect(DAIRY_KEYWORDS).toContain('condensed milk')
  })
  it('PLANT_BASED_MARKERS contains expected entries', () => {
    expect(PLANT_BASED_MARKERS).toContain('tofu')
    expect(PLANT_BASED_MARKERS).toContain('vegan')
  })
  it('SPICE_INDICATORS contains "masala"', () => {
    expect(SPICE_INDICATORS).toContain('masala')
  })
})
