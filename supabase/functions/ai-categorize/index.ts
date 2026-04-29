import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { item_name, store_name } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    const prompt = `Given this ingredient: "${item_name}"${store_name ? ` (from store: ${store_name})` : ''}

Return ONLY this JSON (no markdown, no explanation):
{
  "category": "<one of the exact values below>",
  "subcategory": "string or null",
  "ai_tags": ["array", "of", "descriptive", "tags"]
}

VALID category values (use EXACTLY as written):
fresh_produce | dairy_eggs | grains_legumes | proteins | spices_herbs | condiments_sauces | oils_fats | frozen | beverages | snacks_sweets | baking | canned_packaged | nuts_seeds | other

Category guide:
- fresh_produce: ALL fresh fruits AND vegetables — apple, kiwi, lemon, mango, banana, berries, tomato, spinach, potato, onion, garlic, ginger, cucumber, capsicum, avocado
- dairy_eggs: milk, cheese, yogurt, paneer, butter, eggs, cream, ghee (as dairy)
- grains_legumes: rice, pasta, bread, flour (all types), oats, lentils, dal, chickpeas, black beans, kidney beans, quinoa, wheat, barley, noodles
- proteins: meat, fish, chicken, tofu, tempeh, seitan, protein powder
- spices_herbs: spices, masalas, dried herbs, salt, pepper, turmeric, cumin, coriander, chili powder, garam masala, oregano, basil
- condiments_sauces: soy sauce, vinegar, hot sauce, ketchup, mustard, mayonnaise, fish sauce, teriyaki, hoisin, pesto, jam, spreads, dips, hummus
- oils_fats: cooking oils, olive oil, coconut oil, ghee (cooking), vegetable oil, sesame oil
- frozen: frozen vegetables, frozen meals, ice cream, frozen fish
- beverages: tea, coffee, juice, soft drinks, plant milk, water, drinks
- snacks_sweets: chips, crackers, cookies, chocolate, candy, biscuits, packaged snacks
- baking: sugar, baking powder, baking soda, cocoa powder, vanilla extract, yeast, cake mix, icing sugar, cornstarch
- canned_packaged: tinned/canned/jarred goods, canned tomatoes, canned beans, packaged dry goods, dry shelf items
- nuts_seeds: almonds, cashews, peanuts, walnuts, pistachios, sesame seeds, flaxseed, chia seeds, sunflower seeds, pumpkin seeds, pine nuts
- other: nutritional yeast, spirulina, supplements, vitamins, specialty/uncommon items not fitting above`

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    let rawText = data.content?.[0]?.text ?? '{}'
    // Strip markdown code fences Claude sometimes wraps around JSON
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const result = JSON.parse(rawText)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
