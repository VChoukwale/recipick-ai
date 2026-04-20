interface Props {
  value: string
  onChange: (val: string) => void
}

const UNITS = [
  { group: 'Count',  options: ['pcs', 'can', 'cans', 'bottle', 'pack', 'bag', 'box', 'bunch', 'loaf'] },
  { group: 'Weight', options: ['g', 'kg', 'lb', 'oz'] },
  { group: 'Volume', options: ['ml', 'L', 'cup', 'tbsp', 'tsp'] },
]

// Parse "500 g" → { amount: "500", unit: "g" }
function parse(val: string): { amount: string; unit: string } {
  const match = val.trim().match(/^([\d.]+)\s*(.*)$/)
  if (match) return { amount: match[1], unit: match[2].trim() }
  return { amount: val, unit: 'pcs' }
}

export default function QuantityInput({ value, onChange }: Props) {
  const { amount, unit } = parse(value)

  function update(newAmount: string, newUnit: string) {
    const amt = newAmount.trim()
    onChange(amt ? `${amt} ${newUnit}` : '')
  }

  return (
    <div className="flex gap-2">
      <input
        type="number"
        min="0"
        step="any"
        value={amount}
        onChange={e => update(e.target.value, unit)}
        placeholder="Qty"
        className="input-field w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <select
        value={unit}
        onChange={e => update(amount, e.target.value)}
        className="input-field flex-1"
      >
        {UNITS.map(group => (
          <optgroup key={group.group} label={group.group}>
            {group.options.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
