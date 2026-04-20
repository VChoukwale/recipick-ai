import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SettingsSheet from '../ui/SettingsSheet'
import { useTheme } from '../../hooks/useTheme'

export default function AppShell() {
  const { dark, toggle } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="app-desktop-bg min-h-screen flex items-start justify-center">
      <div className="flex flex-col h-screen w-full max-w-lg relative bg-cream-50 dark:bg-charcoal-900 sm:shadow-[0_0_60px_rgba(0,0,0,0.12)] dark:sm:shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-b border-stone-100 dark:border-charcoal-800">
          <span className="font-display font-800 text-lg text-brand-500 tracking-tight">recipick.ai</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-50 dark:bg-charcoal-800 border border-stone-100 dark:border-charcoal-700 hover:bg-stone-100 dark:hover:bg-charcoal-700 active:scale-95 transition-all duration-150"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-50 dark:bg-charcoal-800 border border-stone-100 dark:border-charcoal-700 hover:bg-stone-100 dark:hover:bg-charcoal-700 active:scale-95 transition-all duration-150"
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
