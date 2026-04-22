import { NavLink } from 'react-router-dom'
import { useCookingAssistant } from '../../contexts/CookingAssistantContext'

const tabs = [
  { to: '/',        icon: '🏠', label: 'Home'    },
  { to: '/pantry',  icon: '🧺', label: 'Pantry'  },
  { to: '/shop',    icon: '🛒', label: 'Shop'    },
  { to: '/recipes', icon: '📖', label: 'Recipes' },
  { to: '/inbox',   icon: '📥', label: 'Inbox'   },
]

export default function BottomNav() {
  const { open, setOpen } = useCookingAssistant()

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
                  <span className={`text-xl leading-none transition-transform duration-200 ${isActive ? 'scale-[1.15]' : 'scale-100'}`}>
                    {icon}
                  </span>
                </div>
                <span className="text-[10px] font-display font-700 leading-none" style={{ color: isActive ? '#E8713A' : 'var(--t3)' }}>
                  {label}
                </span>
                {isActive && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#E8713A' }} />}
              </>
            )}
          </NavLink>
        ))}

        {/* Chef Sage — AI assistant, pops above nav bar */}
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col items-center justify-center px-3 gap-0.5 transition-all duration-150 min-w-0 relative"
          style={{ marginTop: '-18px' }}
        >
          {/* Glowing circle base */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: 52,
              height: 52,
              background: open
                ? 'linear-gradient(135deg, #E8713A, #D85F22)'
                : 'linear-gradient(135deg, #F08248, #E8713A)',
              boxShadow: open
                ? '0 0 0 4px rgba(232,113,58,0.28), 0 0 22px 8px rgba(232,113,58,0.50)'
                : '0 0 0 3px rgba(232,113,58,0.20), 0 0 16px 5px rgba(232,113,58,0.35)',
              transform: open ? 'scale(1.10)' : 'scale(1)',
            }}
          >
            <span className="text-2xl leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }}>
              👨‍🍳
            </span>
            {/* AI badge */}
            <span
              className="absolute -top-1 -right-1 text-[9px] font-display font-700 px-1 rounded-full leading-none flex items-center justify-center"
              style={{
                background: '#fff',
                color: '#E8713A',
                height: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                border: '1px solid rgba(232,113,58,0.25)',
              }}
            >AI</span>
          </div>
          <span className="text-[10px] font-display font-700 leading-none mt-1" style={{ color: '#E8713A' }}>
            Sage
          </span>
        </button>
      </div>
    </nav>
  )
}
