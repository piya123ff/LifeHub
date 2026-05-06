import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

const V2_KEY   = 'lifehub_workout_v2'
const COOL_KEY = 'lifehub_cooldown_pref'

export const workoutService = {
  // ─── Legacy sessions (streak / chart / week summary) ───────────
  getAll: () => storageGet(STORAGE_KEYS.WORKOUTS, []),

  add(session) {
    const list = storageGet(STORAGE_KEYS.WORKOUTS, [])
    const item = { id: generateId(), date: new Date().toISOString(), ...session }
    list.unshift(item)
    storageSet(STORAGE_KEYS.WORKOUTS, list)
    return item
  },

  update(id, data) {
    const list = storageGet(STORAGE_KEYS.WORKOUTS, [])
    const idx  = list.findIndex(s => s.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], ...data }
    return storageSet(STORAGE_KEYS.WORKOUTS, list)
  },

  delete(id) {
    return storageSet(STORAGE_KEYS.WORKOUTS,
      storageGet(STORAGE_KEYS.WORKOUTS, []).filter(s => s.id !== id))
  },

  getWeeklySummary() {
    const all     = storageGet(STORAGE_KEYS.WORKOUTS, [])
    const weekAgo = new Date(Date.now() - 7 * 864e5)
    const week    = all.filter(s => new Date(s.date) >= weekAgo)
    return {
      sessions:     week.length,
      totalMinutes: week.reduce((s, w) => s + (w.duration || 0), 0),
      calories:     week.reduce((s, w) => s + (w.calories  || 0), 0),
    }
  },

  getWeeklyChart() {
    const all  = storageGet(STORAGE_KEYS.WORKOUTS, [])
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    return Array.from({ length: 7 }, (_, i) => {
      const d   = new Date(); d.setDate(d.getDate() - (6 - i))
      const str = d.toDateString()
      const row = all.filter(s => new Date(s.date).toDateString() === str)
      return {
        day:      days[d.getDay()],
        minutes:  row.reduce((s, w) => s + (w.duration || 0), 0),
        calories: row.reduce((s, w) => s + (w.calories  || 0), 0),
        sessions: row.length,
      }
    })
  },

  // ─── V2 Sessions ───────────────────────────────────────────────
  getV2Sessions() {
    return storageGet(V2_KEY, [])
  },

  addV2Session(session) {
    const list = storageGet(V2_KEY, [])
    const item = { id: generateId(), ...session }
    list.unshift(item)
    storageSet(V2_KEY, list)
    return item
  },

  deleteV2Session(id) {
    const list = storageGet(V2_KEY, []).filter(s => s.id !== id)
    storageSet(V2_KEY, list)
  },

  // ─── Cooldown preference ───────────────────────────────────────
  getCooldownPref() {
    return storageGet(COOL_KEY, 10)
  },

  setCooldownPref(mins) {
    storageSet(COOL_KEY, mins)
  },
}
