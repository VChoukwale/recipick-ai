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

Return ONLY this JSON (no markdown):
{
  "category": one of: fresh_produce|fruits|dairy_eggs|protein|nuts_seeds|grains_legumes|spices_herbs|condiments_sauces|oils_fats|frozen|canned|dry_shelf|baking|snacks|beverages|dips|supplements|other,
  "subcategory": "string or null",
  "ai_tags": ["array", "of", "descriptive", "tags"]
}

Category guide: fresh_produce=vegetables/leafy greens, fruits=all fruits (apple/mango/banana/berries), dairy_eggs=milk/cheese/yogurt/eggs, protein=meat/fish/tofu/tempeh/legume-based proteins, nuts_seeds=almonds/cashews/peanuts/sesame/flaxseed, grains_legumes=rice/lentils/dal/flour/pasta/chickpeas, spices_herbs=spices/masalas/dried herbs, condiments_sauces=sauces/vinegar/soy sauce/hot sauce, oils_fats=cooking oils/ghee/butter, frozen=frozen foods, canned=tinned/jarred goods, dry_shelf=packaged dry goods, baking=sugar/baking powder/cocoa/vanilla, snacks=chips/crackers/packaged snacks, beverages=drinks/tea/coffee/juice, dips=hummus/pesto/jam/spreads, supplements=protein powder/vitamins/superfoods, other=everything else.`

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
    const result = JSON.parse(data.content?.[0]?.text ?? '{}')

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
