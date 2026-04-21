import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { PantryItem, PantryCategory } from '../../types/database'

interface Message {
  role: 'user' | 'assistant'
  text: string
  actions?: { add: string[]; mark_unavailable: string[]; remove: string[] }
}

interface Props {
  pantryItems: PantryItem[]
  onPantryUpdate: () => void
  onClose: () => void
}

export default function PantryChat({ pantryItems, onPantryUpdate, onClose }: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hey! Tell me what changed in your pantry. For example: "I just bought potatoes and garlic" or "I\'m out of spinach and tomatoes".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const pantryNames = pantryItems.filter(i => i.is_available).map(i => i.name)

      const { data, error } = await supabase.functions.invoke('ai-pantry-chat', {
        body: { message: text, pantry_items: pantryNames },
      })

      if (error || !data || data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Try again?' }])
        return
      }

      const { actions, reply } = data as {
        actions: { add: string[]; mark_unavailable: string[]; remove: string[] }
        reply: string
      }

      // Execute DB mutations
      await applyActions(actions)

      setMessages(prev => [...prev, { role: 'assistant', text: reply, actions }])
      onPantryUpdate()
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Try again?' }])
    } finally {
      setLoading(false)
    }
  }

  async function applyActions(actions: { add: string[]; mark_unavailable: string[]; remove: string[] }) {
    const uid = user!.id

    // Add new items
    if (actions.add.length > 0) {
      const inserts = actions.add.map(name => ({
        user_id: uid,
        name,
        category: 'other' as PantryCategory,
        is_available: true,
        is_favorite: false,
        is_star_ingredient: false,
        ai_tags: [],
      }))
      await supabase.from('pantry_items').insert(inserts)

      // Trigger async categorization for each new item
      for (const name of actions.add) {
        supabase.functions.invoke('ai-categorize', { body: { item_name: name } }).then(({ data }) => {
          if (data?.category) {
            supabase.from('pantry_items')
              .update({ category: data.category, ai_tags: data.ai_tags ?? [] })
              .eq('user_id', uid)
              .eq('name', name)
          }
        })
      }
    }

    // Mark unavailable — match by name (case-insensitive)
    for (const name of actions.mark_unavailable) {
      const match = pantryItems.find(i => i.name.toLowerCase() === name.toLowerCase())
      if (match) {
        await supabase.from('pantry_items').update({ is_available: false }).eq('id', match.id)
      }
    }

    // Remove permanently
    for (const name of actions.remove) {
      const match = pantryItems.find(i => i.name.toLowerCase() === name.toLowerCase())
      if (match) {
        await supabase.from('pantry_items').delete().eq('id', match.id)
      }
    }
  }

  function ActionChips({ actions }: { actions: Message['actions'] }) {
    if (!actions) return null
    const chips: { label: string; color: string }[] = []
    actions.add.forEach(n => chips.push({ label: `+ ${n}`, color: '#16a34a' }))
    actions.mark_unavailable.forEach(n => chips.push({ label: `✕ ${n}`, color: '#d97706' }))
    actions.remove.forEach(n => chips.push({ label: `🗑 ${n}`, color: '#dc2626' }))
    if (!chips.length) return null
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {chips.map((c, i) => (
          <span key={i} className="text-[11px] font-display font-600 px-2 py-0.5 rounded-full"
            style={{ background: c.color + '18', color: c.color, border: `1px solid ${c.color}30` }}>
            {c.label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col rounded-t-3xl max-h-[75vh]"
        style={{ background: 'var(--s2)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', marginBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>

        {/* Handle + header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-3" style={{ borderBottom: '1px solid var(--bdr-s)' }}>
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bdr-m)' }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
                ✨
              </div>
              <div>
                <p className="font-display font-700 text-sm" style={{ color: 'var(--t1)' }}>Pantry Assistant</p>
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Powered by Claude</p>
              </div>
            </div>
            <button onClick={onClose} className="text-lg hover:opacity-60 transition-opacity"
              style={{ color: 'var(--t3)' }}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed`}
                style={msg.role === 'user'
                  ? { background: '#E8713A', color: '#fff', borderBottomRightRadius: 6 }
                  : { background: 'var(--s1)', color: 'var(--t1)', borderBottomLeftRadius: 6 }
                }>
                {msg.text}
                {msg.role === 'assistant' && <ActionChips actions={msg.actions} />}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--s1)', borderBottomLeftRadius: 6 }}>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--t3)', animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-6 pt-2" style={{ borderTop: '1px solid var(--bdr-s)' }}>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. I just bought potatoes and garlic…"
              className="input-field flex-1 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}
            >
              ↑
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
