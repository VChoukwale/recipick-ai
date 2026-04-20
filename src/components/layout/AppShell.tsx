import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useTheme } from '../../hooks/useTheme'

export default function AppShell() {
  const { dark, toggle } = useTheme()

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto relative">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-cream-100/90 dark:bg-charcoal-900/90 backdrop-blur-sm border-b border-cream-200 dark:border-charcoal-800">
        <span className="font-display font-800 text-lg text-brand-500 tracking-tight">recipick.ai</span>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
