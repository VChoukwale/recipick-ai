import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',        icon: '🏠', label: 'Home'    },
  { to: '/pantry',  icon: '🧺', label: 'Pantry'  },
  { to: '/shop',    icon: '🛒', label: 'Shop'    },
  { to: '/recipes', icon: '📖', label: 'Recipes' },
  { to: '/inbox',   icon: '📥', label: 'Inbox'   },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-charcoal-900 border-t border-cream-200 dark:border-charcoal-800 safe-area-inset-bottom">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-150 min-w-0 ` +
              (isActive
                ? 'text-brand-500'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300')
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-display font-600 leading-none ${isActive ? 'text-brand-500' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
