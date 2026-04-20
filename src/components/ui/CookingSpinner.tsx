import { useState, useEffect } from 'react'

const EMOJIS = ['🍳', '🥘', '🫕', '🍲', '🥗', '🍜', '🥙', '🧆', '🥣', '🍱', '🥞', '🫔', '🫙', '🍛', '🥘', '🧇', '🫓', '🥗']

interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  intervalMs?: number
}

export default function CookingSpinner({ size = 'md', label, intervalMs = 700 }: Props) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * EMOJIS.length))

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % EMOJIS.length), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])

  const sizeClass = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-6xl' : 'text-4xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        key={idx}
        className={`${sizeClass} inline-block animate-bounce`}
        style={{ animationDuration: '0.6s' }}
      >
        {EMOJIS[idx]}
      </span>
      {label && <p className="text-sm font-body text-stone-400 dark:text-stone-500">{label}</p>}
    </div>
  )
}
