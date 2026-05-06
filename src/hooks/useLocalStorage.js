import { useState, useCallback } from 'react'

/**
 * useLocalStorage(getFn)
 * Returns [data, refresh] — call refresh() after any mutation
 * to re-render with the latest data from localStorage.
 */
export function useLocalStorage(getFn) {
  const [data, setData] = useState(() => getFn())
  const refresh = useCallback(() => setData(getFn()), [getFn])
  return [data, refresh]
}
