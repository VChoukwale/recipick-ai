import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SettingsSheet from '../ui/SettingsSheet'
import { useTheme } from '../../hooks/useTheme'

export default function AppShell() {
  const { dark, toggle } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-cream-100 to-orange-50 dark:from-charcoal-950 dark:via-stone-950 dark:to-charcoal-900 flex items-start justify-center">
      {/* Decorative blobs + floating food — desktop only */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-brand-300/25 dark:bg-brand-900/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-amber-300/30 dark:bg-amber-900/15 rounded-full blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute -bottom-36 left-1/4 w-[440px] h-[440px] bg-sage-300/22 dark:bg-sage-900/15 rounded-full blur-3xl animate-blob [animation-delay:6s]" />
        <div className="absolute top-2/3 -left-20 w-72 h-72 bg-orange-200/30 dark:bg-orange-900/12 rounded-full blur-2xl animate-blob [animation-delay:1.5s]" />
        {/* Floating food emojis */}
        {(['🥗','🫕','🌿','🍋','🥑','🧄','🌶️','🫚'] as const).map((emoji, i) => (
          <span
            key={i}
            className="absolute text-3xl select-none animate-float"
            style={{
              left:  `${[6,88,4,90,7,85,10,82][i]}%`,
              top:   `${[12,20,55,65,82,38,72,50][i]}%`,
              opacity: 0.12,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + i * 0.5}s`,
            }}
          >{emoji}</span>
        ))}
      </div>

      <div className="flex flex-col h-screen w-full max-w-lg relative sm:shadow-2xl sm:shadow-stone-300/40 dark:sm:shadow-black/60 sm:ring-1 sm:ring-black/5">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-cream-100/90 dark:bg-charcoal-900/90 backdrop-blur-sm border-b border-cream-200 dark:border-charcoal-800">
          <span className="font-display font-800 text-lg text-brand-500 tracking-tight">recipick.ai</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150"
              title="Settings"
            >
              <span className="text-base">⚙️</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}
