import { useCallback, useEffect, useState } from 'react'

// Tiny hash router: #/ = landing, #/ask and #/benchmark = the console tabs.
const ROUTES = { '#/ask': 'ask', '#/benchmark': 'eval' }
const HASHES = { ask: '#/ask', eval: '#/benchmark', landing: '#/' }

const read = () => ROUTES[window.location.hash] ?? 'landing'

export function useHashRoute() {
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((name) => {
    window.location.hash = HASHES[name] ?? '#/'
  }, [])

  return [route, go]
}
