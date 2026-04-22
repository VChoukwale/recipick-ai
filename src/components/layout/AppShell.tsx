import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SettingsSheet from '../ui/SettingsSheet'
import CookingAssistant from '../ui/CookingAssistant'
import { CookingAssistantProvider } from '../../contexts/CookingAssistantContext'
import { useTheme } from '../../hooks/useTheme'

export default function AppShell() {
  const { dark, toggle } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <CookingAssistantProvider>
    <div className="app-shell-outer min-h-screen flex items-start justify-center">
      {/* App card — elevated above the desktop gradient */}
      <div
        className="flex flex-col h-screen w-full max-w-lg relative sm:shadow-[0_0_80px_-10px_rgba(0,0,0,0.18)] dark:sm:shadow-[0_0_80px_-10px_rgba(0,0,0,0.70)]"
        style={{ background: 'var(--s0)' }}
      >

        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md"
          style={{ background: 'var(--s3)', borderBottom: '1px solid var(--bdr-s)', boxShadow: 'var(--shd-sm)' }}
        >
          <span className="font-display font-800 text-lg tracking-tight" style={{ color: '#E8713A' }}>
            recipick.ai
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all duration-150"
              style={{ background: 'var(--s1)', border: '1px solid var(--bdr-s)' }}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all duration-150"
              style={{ background: 'var(--s1)', border: '1px solid var(--bdr-s)' }}
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
        <CookingAssistant />
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
    </CookingAssistantProvider>
  )
}
