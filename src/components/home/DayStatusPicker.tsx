import type { DayStatus } from '../../types/database'

interface Props {
  value: DayStatus
  busyUntilTime: string
  onChange: (status: DayStatus, busyUntilTime?: string) => void
}

const OPTIONS: { value: DayStatus; icon: string; label: string; sub: string }[] = [
  { value: 'home_all_day', icon: '🏠', label: 'Home all day',  sub: 'Full cooking mode' },
  { value: 'busy_until',   icon: '⏰', label: 'Busy until…',   sub: 'Pick a time below' },
  { value: 'late_night',   icon: '🌙', label: 'Late night',    sub: 'Quick & cozy' },
  { value: 'quick_only',   icon: '⚡', label: 'Quick only',    sub: '30 min max' },
]

export default function DayStatusPicker({ value, busyUntilTime, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(opt => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value, opt.value === 'busy_until' ? busyUntilTime : undefined)}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-2xl border transition-all duration-150 text-left
                ${selected
                  ? 'bg-brand-500 border-brand-500 text-white shadow-md'
                  : 'bg-white dark:bg-charcoal-800 border-cream-200 dark:border-charcoal-700 text-stone-700 dark:text-stone-300 hover:border-brand-300 dark:hover:border-brand-600'
                }`}
            >
              <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
              <div>
                <p className={`text-sm font-display font-700 leading-tight ${selected ? 'text-white' : ''}`}>
                  {opt.label}
                </p>
                <p className={`text-xs font-body mt-0.5 ${selected ? 'text-brand-100' : 'text-stone-400 dark:text-stone-500'}`}>
                  {opt.sub}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {value === 'busy_until' && (
        <input
          type="time"
          value={busyUntilTime}
          onChange={e => onChange('busy_until', e.target.value)}
          className="input-field text-sm"
        />
      )}
    </div>
  )
}
