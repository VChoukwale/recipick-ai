import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the pantry assistant for recipick.ai. Users tell you in plain language what changed in their pantry and you call the update_pantry tool to apply those changes.

Intent mapping:
- "I bought X", "just got X", "picked up X", "add X", "I have X now" → add
- "I'm out of X", "used up X", "finished X", "no more X", "ran out of X", "I don't have X anymore" → mark_unavailable
- "remove X", "delete X", "throw out X", "getting rid of X", "toss X" → remove

Rules:
- Always call update_pantry, even when only one category has items
- Normalise names to singular lowercase (tomatoes → tomato, onions → onion)
- If the user mentions a quantity ("2kg potatoes") just use the ingredient name ("potato")
- After the tool call respond in 1 short friendly sentence confirming what changed`

const TOOLS = [
  {
    name: 'update_pantry',
    description: 'Apply the changes the user described to their pantry',
    input_schema: {
      type: 'object',
      properties: {
        add: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredient names to add as new available pantry items',
        },
        mark_unavailable: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredient names to mark as out of stock (kept in pantry but flagged unavailable)',
        },
        remove: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredient names to permanently delete from the pantry',
        },
      },
    },
  },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { message, pantry_items = [] } = await req.json()
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    const userContent = pantry_items.length
      ? `Current pantry: ${pantry_items.join(', ')}\n\nWhat I want to do: ${message}`
      : `My pantry is currently empty.\n\nWhat I want to do: ${message}`

    // First turn: get tool call
    const res1 = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: 'any' },
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    const data1 = await res1.json()
    if (!res1.ok) throw new Error(`Anthropic error: ${JSON.stringify(data1)}`)

    const toolBlock = data1.content?.find((b: { type: string }) => b.type === 'tool_use')
    const actions = {
      add: (toolBlock?.input?.add ?? []) as string[],
      mark_unavailable: (toolBlock?.input?.mark_unavailable ?? []) as string[],
      remove: (toolBlock?.input?.remove ?? []) as string[],
    }

    // Second turn: send tool result, get friendly reply
    const res2 = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 128,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: data1.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolBlock?.id ?? '',
              content: 'Done',
            }],
          },
        ],
      }),
    })

    const data2 = await res2.json()
    const reply = data2.content?.find((b: { type: string }) => b.type === 'text')?.text ?? 'Done!'

    return new Response(JSON.stringify({ actions, reply }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
