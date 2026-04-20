import { useState } from 'react'

const PRESET_STORES = [
  "Trader Joe's",
  'Whole Foods',
  'Walmart',
  'Target',
  'Costco',
  'Kroger',
  'Safeway',
  'Aldi',
  'Sprouts',
  'Stop & Shop',
  'Amazon Fresh',
  'Local Market',
]

interface Props {
  value: string
  onChange: (val: string) => void
}

export default function StoreInput({ value, onChange }: Props) {
  const isCustom = value !== '' && !PRESET_STORES.includes(value)
  const [showCustom, setShowCustom] = useState(isCustom)

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__other__') {
      setShowCustom(true)
      onChange('')
    } else {
      setShowCustom(false)
      onChange(val)
    }
  }

  const selectValue = showCustom ? '__other__' : (value || '')

  return (
    <div className="space-y-2">
      <select value={selectValue} onChange={handleSelect} className="input-field">
        <option value="">No store (skip)</option>
        {PRESET_STORES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
        <option value="__other__">Other — type a store name…</option>
      </select>

      {showCustom && (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type store name…"
          className="input-field"
        />
      )}
    </div>
  )
}
