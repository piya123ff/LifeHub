import { useState, useEffect } from 'react'

/**
 * useToday — returns today's Date, refreshes at midnight.
 */
export function useToday() {
  const [today, setToday] = useState(new Date())

  useEffect(() => {
    const now      = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const ms       = midnight - now
    const timer    = setTimeout(() => setToday(new Date()), ms)
    return () => clearTimeout(timer)
  }, [today])

  return today
}

export function getThaiGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'อรุณสวัสดิ์ 🌅'
  if (h < 17) return 'สวัสดีตอนบ่าย 🌤️'
  return 'สวัสดีตอนเย็น 🌙'
}
