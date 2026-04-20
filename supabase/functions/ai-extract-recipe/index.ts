import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  const html = await pageRes.text()

  // Extract video title and description from meta tags for context
  const titleMatch = html.match(/<meta name="title" content="([^"]+)"/)
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/s)
  const title = titleMatch?.[1] ?? ''
  const desc = descMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') ?? ''

  // Find caption tracks embedded in the page JS
  const captionMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])/)
  let transcript = ''

  if (captionMatch) {
    try {
      const tracks = JSON.parse(captionMatch[1])
      const track = tracks.find((t: { languageCode: string }) =>
        t.languageCode === 'en' || t.languageCode === 'en-US'
      ) ?? tracks[0]

      if (track?.baseUrl) {
        const xmlRes = await fetch(track.baseUrl)
        const xml = await xmlRes.text()
        transcript = xml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 12000)
      }
    } catch { /* no transcript available */ }
  }

  const parts = []
  if (title) parts.push(`Video title: ${title}`)
  if (desc) parts.push(`Video description:\n${desc.slice(0, 3000)}`)
  if (transcript) parts.push(`Auto-generated transcript:\n${transcript}`)
  return parts.join('\n\n')
}

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })
  if (!res.ok) return ''
  const html = await res.text()
  return html
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
}

const SCHEMA = `{
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body = await req.json()
    const { url, text } = body

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    let prompt = ''

    if (text) {
      // Text paste mode — most reliable, works for YouTube descriptions, Instagram captions, anything
      prompt = `Extract a vegetarian/vegan recipe from this text. The app is vegetarian/vegan only — if the recipe contains meat or fish, return {"error": "This recipe contains meat or fish and cannot be imported."}.

Text:
${text.slice(0, 15000)}

${url ? `Source URL (for reference only): ${url}` : ''}

Return ONLY this JSON (no markdown). If you cannot find a recipe in the text, return {"error": "No recipe found in this text."}.
${SCHEMA}`
    } else if (url) {
      let pageText = ''
      const ytId = extractYouTubeId(url)
      try {
        pageText = ytId ? await fetchYouTubeTranscript(ytId) : await fetchPageText(url)
      } catch { pageText = '' }

      const sourceLabel = ytId ? 'YouTube video transcript' : 'page content'

      prompt = `Extract a vegetarian/vegan recipe from this source. The app is vegetarian/vegan only — if the recipe contains meat or fish, return {"error": "This recipe contains meat or fish and cannot be imported."}.

URL: ${url}
${pageText
  ? `${sourceLabel}:\n${pageText}`
  : `(Content could not be fetched. Use your knowledge of this URL to reconstruct the recipe if you know it. Otherwise return {"error": "Could not extract a recipe from this page. Try the Paste Text tab instead."})`
}

Return ONLY this JSON (no markdown).
${SCHEMA}`
    } else {
      throw new Error('Provide either url or text')
    }

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
