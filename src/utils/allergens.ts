export const ALLERGENS = [
  { id: 'peanuts',    label: 'Peanuts',       emoji: '🥜', keywords: ['peanut', 'groundnut'] },
  { id: 'tree_nuts',  label: 'Tree Nuts',      emoji: '🌰', keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'pine nut', 'brazil nut'] },
  { id: 'dairy',      label: 'Dairy',          emoji: '🥛', keywords: ['milk', 'cheese', 'cream', 'yogurt', 'curd', 'dahi', 'ghee', 'paneer', 'whey', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta', 'buttermilk', 'dairy butter'] },
  { id: 'eggs',       label: 'Eggs',           emoji: '🥚', keywords: ['egg'] },
  { id: 'wheat',      label: 'Wheat / Gluten', emoji: '🌾', keywords: ['wheat', 'flour', 'bread', 'pasta', 'semolina', 'gluten', 'noodle', 'bulgur', 'barley', 'rye', 'seitan'] },
  { id: 'soy',        label: 'Soy',            emoji: '🫘', keywords: ['soy', 'tofu', 'tempeh', 'edamame', 'miso', 'soybean'] },
  { id: 'sesame',     label: 'Sesame',         emoji: '🌿', keywords: ['sesame', 'tahini', 'til'] },
  { id: 'shellfish',  label: 'Shellfish',       emoji: '🦐', keywords: ['shrimp', 'crab', 'lobster', 'prawn', 'clam', 'oyster', 'scallop', 'mussel'] },
  { id: 'fish',       label: 'Fish',           emoji: '🐟', keywords: ['fish', 'tuna', 'salmon', 'cod', 'tilapia', 'sardine', 'anchovy', 'halibut', 'trout'] },
] as const

export type AllergenId = typeof ALLERGENS[number]['id']

export function detectAllergens(
  ingredients: { name: string }[],
  userAllergies: string[]
): string[] {
  if (!userAllergies?.length) return []
  const found: string[] = []
  for (const allergen of ALLERGENS) {
    if (!userAllergies.includes(allergen.id)) continue
    const hit = ingredients.some(ing =>
      allergen.keywords.some(kw => ing.name.toLowerCase().includes(kw))
    )
    if (hit) found.push(allergen.label)
  }
  return found
}
