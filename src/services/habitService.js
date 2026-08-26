import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

/* ── helpers ── */
function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

function getLogs() {
  return storageGet(STORAGE_KEYS.HABIT_LOGS, {})
}

function saveLogs(logs) {
  storageSet(STORAGE_KEYS.HABIT_LOGS, logs)
}

/* ── streak calculator ──────────────────────────────────────────────
   นับวันติดต่อกันจากวันนี้ย้อนหลัง
   ถ้าวันนี้ยังไม่ได้เช็ค ให้เริ่มนับจากเมื่อวาน
───────────────────────────────────────────────────────────────────── */
function calcStreak(habitId) {
  const logs  = getLogs()
  const hLog  = logs[habitId] || {}
  const today = toDateKey()

  let streak = 0
  const d = new Date()

  // ถ้าวันนี้ยังไม่ได้เช็ค เริ่มนับจากเมื่อวาน
  if (!hLog[today]) d.setDate(d.getDate() - 1)

  while (true) {
    const key = toDateKey(d)
    if (!hLog[key]) break
    streak++
    d.setDate(d.getDate() - 1)
    if (streak > 3650) break // safety cap
  }
  return streak
}

/* ── longest streak ever ── */
function calcLongestStreak(habitId) {
  const logs = getLogs()
  const hLog = logs[habitId] || {}
  const dates = Object.keys(hLog).filter(k => hLog[k]).sort()
  if (!dates.length) return 0

  let best = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

/* ══════════════════════════════════════════════════════════════════
   habitService
══════════════════════════════════════════════════════════════════ */
export const habitService = {

  /* ── CRUD ── */
  getAll() {
    return storageGet(STORAGE_KEYS.HABITS, [])
  },

  add(habit) {
    const list = storageGet(STORAGE_KEYS.HABITS, [])
    const item = {
      id:        generateId(),
      createdAt: new Date().toISOString(),
      emoji:     '⭐',
      category:  'general',
      color:     'violet',
      ...habit,
    }
    list.push(item)
    storageSet(STORAGE_KEYS.HABITS, list)
    return item
  },

  update(id, data) {
    const list = storageGet(STORAGE_KEYS.HABITS, [])
    const idx  = list.findIndex(h => h.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], ...data }
    return storageSet(STORAGE_KEYS.HABITS, list)
  },

  delete(id) {
    // ลบ habit + logs ของ habit นั้น
    storageSet(STORAGE_KEYS.HABITS,
      storageGet(STORAGE_KEYS.HABITS, []).filter(h => h.id !== id))
    const logs = getLogs()
    delete logs[id]
    saveLogs(logs)
  },

  /* ── Daily check ── */
  toggle(habitId, dateKey = toDateKey()) {
    const logs = getLogs()
    if (!logs[habitId]) logs[habitId] = {}
    logs[habitId][dateKey] = !logs[habitId][dateKey]
    if (!logs[habitId][dateKey]) delete logs[habitId][dateKey]
    saveLogs(logs)
  },

  isChecked(habitId, dateKey = toDateKey()) {
    const logs = getLogs()
    return !!(logs[habitId]?.[dateKey])
  },

  /* ── Stats ── */
  getStreak(habitId) {
    return calcStreak(habitId)
  },

  getLongestStreak(habitId) {
    return calcLongestStreak(habitId)
  },

  /* ย้อนหลัง N วัน — คืน array [{date, checked}] เรียงเก่า→ใหม่ */
  getRecentDays(habitId, n = 7) {
    const logs = getLogs()
    const hLog = logs[habitId] || {}
    const result = []
    const d = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const day = new Date(d)
      day.setDate(d.getDate() - i)
      const key = toDateKey(day)
      result.push({ date: key, checked: !!hLog[key] })
    }
    return result
  },

  /* completion rate เดือนนี้ (%) */
  getMonthlyRate(habitId) {
    const logs  = getLogs()
    const hLog  = logs[habitId] || {}
    const today = new Date()
    const daysInMonth = today.getDate() // วันที่ผ่านมาในเดือนนี้
    const year  = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    let checked = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${String(d).padStart(2, '0')}`
      if (hLog[key]) checked++
    }
    return daysInMonth > 0 ? Math.round((checked / daysInMonth) * 100) : 0
  },

  /* สรุปภาพรวม */
  getSummary() {
    const habits  = storageGet(STORAGE_KEYS.HABITS, [])
    const today   = toDateKey()
    const doneToday = habits.filter(h => this.isChecked(h.id, today)).length
    return {
      total:     habits.length,
      doneToday,
      remaining: habits.length - doneToday,
    }
  },
}
