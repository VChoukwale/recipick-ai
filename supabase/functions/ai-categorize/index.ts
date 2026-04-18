import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
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
  "category": one of: fresh_produce|dairy_eggs|grains_legumes|spices_herbs|condiments_sauces|frozen|snacks|beverages|dry_shelf|oils_fats|baking|dips|canned|other,
  "subcategory": "string or null",
  "ai_tags": ["array", "of", "descriptive", "tags"]
}`

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
