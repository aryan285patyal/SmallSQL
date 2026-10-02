import { useEffect } from 'react'
import App from './App.jsx'
import DitherBackground from './components/DitherBackground.jsx'
import Landing from './pages/Landing.jsx'
import { useHashRoute } from './lib/useHashRoute.js'
import { isTyping } from './lib/keys.js'
import { useTheme } from './lib/useTheme.js'


// Owns what every page shares: theme, background, and routing.
export default function Root() {
  const [theme, toggleTheme] = useTheme()
  const [route, go] = useHashRoute()

  // t toggles the theme anywhere (ignored while typing).
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 't') toggleTheme()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme])

  return (
    <>
      <DitherBackground theme={theme} />
      {route === 'landing' ? (
        <Landing theme={theme} onToggleTheme={toggleTheme} go={go} />
      ) : (
        <App tab={route} onTab={go} theme={theme} onToggleTheme={toggleTheme} />
      )}
    </>
  )
}
