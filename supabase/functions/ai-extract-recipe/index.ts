import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { url, caption_text } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    const prompt = `Extract a vegetarian/vegan recipe from the following source.
URL: ${url ?? 'not provided'}
Additional text: ${caption_text ?? 'not provided'}

Return ONLY this JSON (no markdown). If you cannot extract a recipe, return {"error": "Could not extract a recipe from this content."}
{
  "title": "string",
  "cuisine_type": "string",
  "ingredients": [{ "name": "string", "quantity": "string" }],
  "instructions": ["step 1", "step 2"],
  "difficulty": "easy|medium|hard",
  "time_minutes": number
}`

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const result = JSON.parse(data.content?.[0]?.text ?? '{"error":"Empty response"}')

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
