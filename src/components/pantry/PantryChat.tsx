import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { PantryItem, PantryCategory } from '../../types/database'

// Web Speech API type shim
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
}
interface ISpeechRecognitionResult { 0: { transcript: string } }
interface ISpeechRecognitionEvent { results: ISpeechRecognitionResult[] }
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

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
  const [listening, setListening] = useState(false)
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleVoice = useCallback(() => {
    if (!voiceSupported) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setInput(transcript)
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
      setInput(prev => {
        if (prev.trim()) {
          setTimeout(() => {
            const form = inputRef.current?.closest('form') as HTMLFormElement | null
            form?.requestSubmit()
          }, 100)
        }
        return prev
      })
    }

    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognition.start()
  }, [voiceSupported, listening])

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
      const { alreadyPresent } = await applyActions(actions)

      // Override reply if all items were already in pantry
      let finalReply = reply
      if (alreadyPresent.length > 0 && actions.add.length === alreadyPresent.length && actions.mark_unavailable.length === 0 && actions.remove.length === 0) {
        const names = alreadyPresent.join(', ')
        finalReply = `${alreadyPresent.length === 1 ? `${alreadyPresent[0]} is` : `${names} are`} already in your pantry! ✓`
      }

      setMessages(prev => [...prev, { role: 'assistant', text: finalReply, actions: { ...actions, add: actions.add.filter(n => !alreadyPresent.includes(n)) } }])
      onPantryUpdate()
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Try again?' }])
    } finally {
      setLoading(false)
    }
  }

  async function applyActions(actions: { add: string[]; mark_unavailable: string[]; remove: string[] }): Promise<{ alreadyPresent: string[] }> {
    const uid = user!.id
    const alreadyPresent: string[] = []

    // Add new items — skip if already in pantry
    if (actions.add.length > 0) {
      const toInsert: string[] = []

      for (const name of actions.add) {
        const existing = pantryItems.find(i => i.name.toLowerCase() === name.toLowerCase())
        if (existing) {
          alreadyPresent.push(name)
          // If it exists but is marked unavailable, restore it
          if (!existing.is_available) {
            await supabase.from('pantry_items').update({ is_available: true }).eq('id', existing.id)
          }
        } else {
          toInsert.push(name)
        }
      }

      if (toInsert.length > 0) {
        const inserts = toInsert.map(name => ({
          user_id: uid,
          name,
          category: 'other' as PantryCategory,
          is_available: true,
          is_favorite: false,
          is_star_ingredient: false,
          ai_tags: [],
        }))
        await supabase.from('pantry_items').insert(inserts)

        for (const name of toInsert) {
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

    return { alreadyPresent }
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
              type="button"
              onClick={voiceSupported ? handleVoice : () => alert('Voice input is not supported in this browser. Try Chrome on Android or desktop.')}
              disabled={loading}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all active:scale-95 ${listening ? 'animate-pulse' : ''}`}
              style={listening
                ? { background: '#dc2626', color: '#fff' }
                : { background: 'var(--s1)', border: '1px solid var(--bdr-m)', color: '#E8713A' }
              }
              title={listening ? 'Stop listening' : 'Speak'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </button>
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
