import { useCallback, useEffect, useState } from 'react'

const KEY = 'smallsql-theme'

// index.html sets data-theme before React loads (no flash); this hook reads and toggles it.
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f2ebdb' : '#0c0a07')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage unavailable: theme just won't persist */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])
  return [theme, toggle]
}
