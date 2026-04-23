import type { DietaryPreference } from '../types/database'

// Exported so tests can verify the keyword sets directly.
export const MEAT_FISH = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'fish', 'prawn',
  'shrimp', 'tuna', 'salmon', 'crab', 'lobster', 'turkey', 'duck', 'bacon',
  'ham', 'sausage', 'anchovy', 'sardine', 'squid', 'mince', 'keema',
  'pepperoni', 'salami',
]

export const DAIRY_KEYWORDS = [
  'milk', 'butter', 'cheese', 'cream', 'yogurt', 'curd', 'dahi', 'ghee',
  'paneer', 'whey', 'honey', 'cheddar', 'mozzarella', 'parmesan', 'ricotta',
  'feta', 'halloumi', 'khoya', 'malai', 'condensed milk',
]

// 'vegan' in the name catches branded plant-based products ("Vegan Chicken Strips").
// 'mock ' has a trailing space intentionally — avoids matching "mock" inside compound words.
export const PLANT_BASED_MARKERS = [
  'plant based', 'plant-based', 'plant protein', 'vegan', 'mock ', 'faux ',
  'beyond meat', 'impossible burger', 'tofu', 'tempeh', 'seitan', 'jackfruit',
]

// Masala/spice packet names often include meat words but contain no meat.
export const SPICE_INDICATORS = [
  'masala', 'spice mix', 'spice blend', 'spice rub', 'seasoning',
  'curry powder', 'marinade', 'tadka', 'tempering',
]

/** Accepts a pre-lowercased ingredient name. */
export function isPlantBased(lower: string): boolean {
  return PLANT_BASED_MARKERS.some(m => lower.includes(m))
}

/** Accepts a pre-lowercased ingredient name. */
export function isSpiceProduct(lower: string): boolean {
  return SPICE_INDICATORS.some(s => lower.includes(s))
}

/**
 * Matches "egg" or "eggs" as a whole word.
 * "eggplant" does NOT match — the word boundary after "egg" is not present.
 * Accepts raw (mixed-case) name; flag `i` handles case internally.
 */
export function hasEggInName(name: string): boolean {
  return /\beggs?\b/i.test(name)
}

/**
 * Returns true if the ingredient violates the given dietary preference.
 *
 * Accepts raw (mixed-case) ingredient names — lowercases internally.
 * Returns false for non_vegetarian and any unrecognised diet string.
 *
 * Known limitation preserved from original: ingredients that contain a dairy
 * keyword substring (e.g. "coconut milk" contains "milk") are flagged for
 * vegan even though they are plant-based. Do not fix this here without
 * updating the corresponding tests.
 */
export function violatesDiet(name: string, diet: DietaryPreference | string): boolean {
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

/**
 * Long-form diet label for user-facing error messages.
 * ("Your focus ingredient isn't part of your vegetarian (no eggs) diet.")
 *
 * For short chip labels (e.g. PantrySection), define a local label in the
 * calling component rather than using this export.
 */
export function dietLabel(diet: DietaryPreference | string): string {
  if (diet === 'vegan') return 'vegan'
  if (diet === 'vegetarian') return 'vegetarian (no eggs)'
  if (diet === 'vegetarian_with_eggs') return 'eggitarian'
  return ''
}
