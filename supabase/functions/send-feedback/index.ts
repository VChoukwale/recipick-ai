import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REACTIONS: Record<string, string> = {
  '💡': 'Suggestion',
  '👍': 'Loving it',
  '🐛': 'Bug report',
  '🤔': 'Question',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { reaction, message, user_name, user_email, user_id } = await req.json()
    if (!message?.trim()) throw new Error('Message is required')

    // Save to DB using service role so RLS doesn't block
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await supabase.from('feedback').insert({ user_id, user_name, user_email, reaction, message })

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const reactionLabel = reaction ? `${reaction} ${REACTIONS[reaction] ?? ''}` : 'General feedback'
      const safeMessage = (message as string)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '<br/>')
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #E8713A; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0; font-size: 18px;">recipick.ai — New Feedback</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; color: #8C7355; font-size: 13px; width: 110px;">From</td>
                <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${user_name ?? 'Anonymous'}</td></tr>
            <tr><td style="padding: 8px 0; color: #8C7355; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; font-size: 14px;">${user_email ?? '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #8C7355; font-size: 13px;">Type</td>
                <td style="padding: 8px 0; font-size: 14px;">${reactionLabel}</td></tr>
          </table>
          <div style="background: #FAF7F2; border: 1px solid #EDE6D6; border-radius: 12px; padding: 16px 20px;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1A140E;">${safeMessage}</p>
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: #8C7355;">Submitted via recipick.ai in-app feedback</p>
        </div>
      `
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'recipick.ai <onboarding@resend.dev>',
          to: [Deno.env.get('FEEDBACK_RECIPIENT_EMAIL') ?? 'feedback@recipick.ai'],
          subject: `recipick.ai Feedback — ${user_name ?? 'User'} ${reaction ?? ''}`.trim(),
          html: emailHtml,
        }),
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
