import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Kai, the friendly cooking assistant for recipick.ai. You are like a knowledgeable foodie friend who gives clear, practical cooking advice.

You help with:
- Cooking techniques (how to sprout matki, how to temper spices, how to knead dough)
- Ingredient questions (what is tamarind, how to store fresh coriander, how long does paneer last)
- Substitutions (no buttermilk? use yogurt + water. no tahini? try peanut butter)
- Recipe tips and troubleshooting (why did my curry turn bitter, how to fix over-salted food)
- Cultural food context (what is the difference between dosa and uttapam, what is miso)
- Cooking tools and equipment (what pan for dosa, do I need a pressure cooker)
- Nutrition and food science (why soak lentils, benefits of fermenting)

RULES:
- Keep answers concise and mobile-friendly — 2-4 short paragraphs max. Use bullet points for steps.
- Sound like a warm, knowledgeable friend — not a textbook. Casual, encouraging tone.
- If asked something completely unrelated to food, cooking, or nutrition, say: "I'm your cooking buddy — I'm best with food questions! Ask me anything about cooking, ingredients, or recipes."
- Never refuse a food/cooking question. Always try to help.
- Use simple language. Avoid jargon unless you explain it.
- For "how to" questions, give numbered steps.
- Respect dietary preferences if the user mentions them.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { message, history = [] } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    // Build messages array from history + new message
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`Anthropic error: ${JSON.stringify(data)}`)

    const reply = data.content?.[0]?.text ?? 'Sorry, I couldn\'t get a response. Please try again.'

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
