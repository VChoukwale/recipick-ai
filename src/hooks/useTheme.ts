import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    // Default to light for new users regardless of system preference
    return stored === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
