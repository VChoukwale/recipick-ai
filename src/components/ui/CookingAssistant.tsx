import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCookingAssistant } from '../../contexts/CookingAssistantContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Keep only last N turns to avoid hitting token limits
const MAX_HISTORY = 10

// Simple markdown renderer: bold (**text**), bullet lines (- ), numbered (1. )
function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()

    // Parse inline bold within a line
    function parseBold(s: string): React.ReactNode[] {
      const parts = s.split(/\*\*(.*?)\*\*/g)
      return parts.map((part, idx) =>
        idx % 2 === 1 ? <strong key={idx} className="font-700">{part}</strong> : part
      )
    }

    // Bullet line
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.slice(2)
      return (
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="flex-shrink-0 mt-0.5 text-xs opacity-60">•</span>
          <span>{parseBold(content)}</span>
        </div>
      )
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/)
      if (match) {
        return (
          <div key={i} className="flex gap-1.5 my-0.5">
            <span className="flex-shrink-0 font-700 text-xs opacity-70 mt-0.5">{match[1]}.</span>
            <span>{parseBold(match[2])}</span>
          </div>
        )
      }
    }

    // Empty line → small spacer
    if (trimmed === '') return <div key={i} className="h-1.5" />

    // Regular line
    return <div key={i} className="my-0.5">{parseBold(trimmed)}</div>
  })
}

export default function CookingAssistant() {
  const { open, setOpen } = useCookingAssistant()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SRConstructor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SRConstructor) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SRConstructor() as any
    rec.lang = 'en-US'
    rec.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setInput(transcript)
        setListening(false)
        // Auto-send after voice
        setTimeout(() => sendMessage(transcript), 300)
      }
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMessage: Message = { role: 'user', content: msg }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Send only last MAX_HISTORY messages as history (exclude the one we just added)
      const history = messages.slice(-MAX_HISTORY)
      const { data, error } = await supabase.functions.invoke('ai-cooking-assistant', {
        body: { message: msg, history },
      })
      if (error) throw error
      const reply = data?.reply ?? 'Sorry, something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hmm, I couldn\'t reach my brain right now. Check your connection and try again! 🍳',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = [
    'How do I sprout matki at home?',
    'How to fix an over-salted curry?',
    'Best substitute for buttermilk?',
    'How long to soak chana dal?',
  ]

  return (
    <>
      {/* Chat sheet */}
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div
            className="relative flex flex-col rounded-t-3xl animate-slide-up"
            style={{ background: 'var(--s0)', height: '82vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bdr-m)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-2 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--bdr-s)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #E8713A22, #E8713A11)', border: '1px solid #E8713A30' }}>
                  👨‍🍳
                </div>
                <div>
                  <p className="font-display font-700 text-base leading-tight" style={{ color: 'var(--t1)' }}>Chef Sage</p>
                  <p className="text-[11px] font-body" style={{ color: 'var(--t3)' }}>Knows everything about cooking</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-70"
                style={{ background: 'var(--s2)', color: 'var(--t3)' }}
              >✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

              {/* Empty state with suggestions */}
              {messages.length === 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                      style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
                      <span className="text-xs">👨‍🍳</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]"
                      style={{ background: 'var(--s2)', border: '1px solid var(--bdr-s)' }}>
                      <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--t1)' }}>
                        Hey! I'm Chef Sage 👨‍🍳 Ask me anything about cooking — techniques, ingredients, substitutions, storage tips, or anything food-related!
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-display font-600 px-1" style={{ color: 'var(--t3)' }}>Try asking…</p>
                  <div className="space-y-2">
                    {suggestedQuestions.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left text-sm font-body px-3.5 py-2.5 rounded-xl border transition-all hover:border-brand-300 active:scale-[0.98]"
                        style={{ background: 'var(--s2)', borderColor: 'var(--bdr-m)', color: 'var(--t2)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-700 text-white mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
                      👨‍🍳
                    </div>
                  )}
                  <div
                    className="rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm font-body leading-relaxed"
                    style={msg.role === 'user'
                      ? { background: 'linear-gradient(135deg, #E8713A, #D85F22)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                      : { background: 'var(--s2)', border: '1px solid var(--bdr-s)', color: 'var(--t1)', borderRadius: '18px 18px 18px 4px' }
                    }
                  >
                    {msg.role === 'assistant'
                      ? renderMarkdown(msg.content)
                      : msg.content
                    }
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-700 text-white"
                    style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
                    K
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--s2)', border: '1px solid var(--bdr-s)' }}>
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--bdr-s)' }}>
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)' }}>
                {/* Mic button */}
                <button
                  type="button"
                  onClick={handleVoice}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-stone-400 hover:text-brand-500'
                  }`}
                  title={listening ? 'Stop listening' : 'Speak your question'}
                >
                  🎤
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={listening ? 'Listening…' : 'Ask anything about cooking…'}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm font-body outline-none min-w-0"
                  style={{ color: 'var(--t1)' }}
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all disabled:opacity-30"
                  style={input.trim() && !loading
                    ? { background: 'linear-gradient(135deg, #E8713A, #D85F22)', color: '#fff' }
                    : { background: 'var(--s1)', color: 'var(--t3)' }
                  }
                >
                  ↑
                </button>
              </div>
              <p className="text-center text-[10px] font-body mt-1.5" style={{ color: 'var(--t3)' }}>
                Cooking questions only · powered by Claude
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
