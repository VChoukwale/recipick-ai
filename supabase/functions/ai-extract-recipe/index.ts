import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipickBot/1.0)' },
  })
  const html = await res.text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 20000)
  return text
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { url } = await req.json()
    if (!url) throw new Error('url is required')

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    let pageText = ''
    try {
      pageText = await fetchPageText(url)
    } catch {
      pageText = ''
    }

    const prompt = `Extract a recipe from this web page content. The app is vegetarian/vegan only — if this page contains a meat/fish recipe, return {"error": "This recipe contains meat or fish and cannot be imported."}.

URL: ${url}
Page content:
${pageText || '(could not fetch page — use URL to infer)'}

Return ONLY this JSON (no markdown, no extra text). If you cannot find a recipe, return {"error": "Could not extract a recipe from this page."}.

{
  "title": "string",
  "description": "string — 1-2 sentence description of the dish",
  "cuisine_type": "string — e.g. Indian, Italian, Mexican",
  "region_detail": "string or null — e.g. Maharashtrian, Sicilian",
  "difficulty": "easy|medium|hard",
  "time_minutes": number,
  "ingredients": [{ "name": "string", "quantity": "string" }],
  "instructions": ["step 1", "step 2"],
  "why_this": "string — one friendly sentence on why this dish is worth making"
}`

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
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`Anthropic error: ${JSON.stringify(data)}`)

    const raw = data.content?.[0]?.text ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const result = JSON.parse(cleaned)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
