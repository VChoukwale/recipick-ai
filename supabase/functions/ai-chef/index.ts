import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are recipick.ai's AI chef. You are a vegetarian/vegan cooking expert with deep knowledge of regional cuisines worldwide — from Maharashtrian food (misal pav, thalipeeth, puran poli) to Korean (bibimbap, japchae) to Sichuan Chinese to Oaxacan Mexican.

RULES:
- ONLY suggest vegetarian or vegan recipes. NEVER suggest meat or fish. The user's dietary_preference tells you if eggs are allowed.
- Always respond in valid JSON format matching the schema below.
- Consider the user's available ingredients, skill level, time of day, and energy level.
- For day_status "busy_until" with time passed: suggest quick, comforting meals (the user just got home tired).
- For day_status "late_night": suggest only quick recipes under 20 minutes.
- For "star_ingredient" mode: build recipes where that ingredient is the HERO.
- For "regional" mode: suggest authentic regional recipes, not generic versions.
- For each missing ingredient, suggest a culturally-appropriate substitution.
- The "why_this" field should sound like a friend recommending food, not a database query.

RESPONSE SCHEMA (return exactly this JSON, no markdown):
{
  "recipes": [
    {
      "title": "string",
      "description": "string",
      "cuisine": "string",
      "region_detail": "string or null",
      "difficulty": "easy|medium|hard",
      "time_minutes": number,
      "ingredients": [{ "name": "string", "quantity": "string", "in_pantry": boolean }],
      "missing_ingredients": [{ "name": "string", "substitution": "string" }],
      "match_percentage": number,
      "instructions": ["step 1", "step 2"],
      "why_this": "string"
    }
  ]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const body = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    const userMessage = JSON.stringify(body)

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const recipes = JSON.parse(text)

    return new Response(JSON.stringify(recipes), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
