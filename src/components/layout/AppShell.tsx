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
      {/* Decorative blobs visible on desktop sides */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/20 dark:bg-brand-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-amber-200/25 dark:bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-sage-200/20 dark:bg-sage-900/10 rounded-full blur-3xl" />
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
