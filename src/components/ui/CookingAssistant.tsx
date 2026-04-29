import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCookingAssistant } from '../../contexts/CookingAssistantContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  redirect_dish?: string
  youtube_query?: string
}

const MAX_HISTORY = 10

function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

// Simple markdown renderer: bold (**text**), bullet lines (- ), numbered (1. )
function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()

    function parseBold(s: string): React.ReactNode[] {
      const parts = s.split(/\*\*(.*?)\*\*/g)
      return parts.map((part, idx) =>
        idx % 2 === 1 ? <strong key={idx} className="font-700">{part}</strong> : part
      )
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.slice(2)
      return (
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="flex-shrink-0 mt-0.5 text-xs opacity-60">•</span>
          <span>{parseBold(content)}</span>
        </div>
      )
    }

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

    if (trimmed === '') return <div key={i} className="h-1.5" />

    return <div key={i} className="my-0.5">{parseBold(trimmed)}</div>
  })
}

const capabilities = [
  { icon: '🔪', label: 'Techniques' },
  { icon: '🧄', label: 'Ingredients' },
  { icon: '🔄', label: 'Substitutions' },
  { icon: '🥘', label: 'Troubleshooting' },
  { icon: '🌍', label: 'Cuisines' },
  { icon: '🥗', label: 'Nutrition' },
]

const suggestedQuestions = [
  'How do I sprout matki at home?',
  'How to fix an over-salted curry?',
  'Best substitute for buttermilk?',
  'How long to soak chana dal?',
]

export default function CookingAssistant() {
  const { open, setOpen } = useCookingAssistant()
  const navigate = useNavigate()
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
      const history = messages.slice(-MAX_HISTORY)
      const { data, error } = await supabase.functions.invoke('ai-cooking-assistant', {
        body: { message: msg, history },
      })
      if (error) throw error
      const reply = data?.reply ?? 'Sorry, something went wrong. Please try again.'
      const redirect_dish: string | undefined = data?.redirect_dish
      const youtube_query: string | undefined = data?.youtube_query
      setMessages(prev => [...prev, { role: 'assistant', content: reply, redirect_dish, youtube_query }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hmm, I couldn\'t reach my brain right now. Check your connection and try again! 🍳',
      }])
    } finally {
      setLoading(false)
    }
  }

  function goToHome(dish: string) {
    setOpen(false)
    navigate(`/?dish=${encodeURIComponent(dish)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <>
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
                {/* Gradient circle avatar matching FAB */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E8713A, #D85F22)',
                    boxShadow: '0 2px 10px rgba(232,113,58,0.40)',
                  }}
                >
                  <span className="text-lg leading-none">👨‍🍳</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-display font-700 text-base leading-tight" style={{ color: 'var(--t1)' }}>Chef Sage</p>
                    <span
                      className="text-[9px] font-display font-700 px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: 'linear-gradient(135deg, #E8713A22, #E8713A33)', color: '#E8713A', border: '1px solid #E8713A40' }}
                    >AI</span>
                  </div>
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

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="space-y-4 pt-1">
                  {/* Intro bubble */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm flex-shrink-0"
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

                  {/* Capability chips */}
                  <div className="flex flex-wrap gap-2 px-0.5">
                    {capabilities.map(c => (
                      <div
                        key={c.label}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display font-600"
                        style={{ background: 'var(--s2)', border: '1px solid var(--bdr-m)', color: 'var(--t2)' }}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--bdr-s)' }} />
                    <p className="text-xs font-display font-600" style={{ color: 'var(--t3)' }}>Try asking…</p>
                    <div className="flex-1 h-px" style={{ background: 'var(--bdr-s)' }} />
                  </div>

                  {/* Suggested questions */}
                  <div className="space-y-2">
                    {suggestedQuestions.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left text-sm font-body px-3.5 py-2.5 rounded-xl border transition-all hover:border-brand-300 active:scale-[0.98] flex items-center gap-2"
                        style={{ background: 'var(--s2)', borderColor: 'var(--bdr-m)', color: 'var(--t2)' }}
                      >
                        <span className="text-[11px] opacity-50">↗</span>
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
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className="rounded-2xl px-3.5 py-2.5 text-sm font-body leading-relaxed"
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #E8713A, #D85F22)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                        : { background: 'var(--s2)', border: '1px solid var(--bdr-s)', color: 'var(--t1)', borderRadius: '18px 18px 18px 4px' }
                      }
                    >
                      {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                    </div>
                    {msg.redirect_dish && (
                      <button
                        onClick={() => goToHome(msg.redirect_dish!)}
                        className="self-start flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-display font-700 text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)', boxShadow: '0 2px 10px rgba(232,113,58,0.35)' }}
                      >
                        <span>🏠</span>
                        <span>Find "{msg.redirect_dish}" on Home</span>
                        <span>→</span>
                      </button>
                    )}
                    {msg.youtube_query && (
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(msg.youtube_query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-display font-700 text-white transition-all active:scale-95"
                        style={{ background: '#FF0000', boxShadow: '0 2px 10px rgba(255,0,0,0.25)' }}
                      >
                        <span>▶</span>
                        <span>Watch on YouTube</span>
                        <span className="text-xs opacity-80">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}>
                    👨‍🍳
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
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2 transition-all"
                style={{
                  background: 'var(--s2)',
                  border: listening ? '1.5px solid #ef4444' : '1.5px solid var(--bdr-m)',
                }}
              >
                {/* Mic button — SVG icon */}
                <button
                  type="button"
                  onClick={handleVoice}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'hover:bg-orange-50 dark:hover:bg-orange-950'
                  }`}
                  style={{ color: listening ? '#fff' : '#E8713A' }}
                  title={listening ? 'Stop listening' : 'Speak your question'}
                >
                  <MicIcon size={16} />
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

                {/* Send button — always orange, dimmed when empty */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!canSend}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #E8713A, #D85F22)',
                    color: '#fff',
                    opacity: canSend ? 1 : 0.35,
                    boxShadow: canSend ? '0 2px 8px rgba(232,113,58,0.40)' : 'none',
                  }}
                >
                  <SendIcon />
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
