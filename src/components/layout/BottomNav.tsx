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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'var(--s3)', borderTop: '1px solid var(--bdr-s)', boxShadow: 'var(--shd-up)' }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-150 min-w-0"
          >
            {({ isActive }) => (
              <>
                <div
                  className="w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
                  style={isActive ? { background: 'rgba(232,113,58,0.10)' } : {}}
                >
                  <span
                    className={`text-xl leading-none transition-transform duration-200 ${isActive ? 'scale-[1.15]' : 'scale-100'}`}
                  >
                    {icon}
                  </span>
                </div>
                <span
                  className="text-[10px] font-display font-700 leading-none"
                  style={{ color: isActive ? '#E8713A' : 'var(--t3)' }}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#E8713A' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
