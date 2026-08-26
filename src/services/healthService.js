import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

const HEALTH_KEY = STORAGE_KEYS.HEALTH

export const healthService = {
  getAll: () => storageGet(HEALTH_KEY, []),

  addWeight(entry) {
    const list = storageGet(HEALTH_KEY, [])
    const item = { id: generateId(), date: new Date().toISOString(), type: 'weight', ...entry }
    list.unshift(item)
    storageSet(HEALTH_KEY, list)
    return item
  },

  addWater(ml) {
    const list  = storageGet(HEALTH_KEY, [])
    const today = new Date().toDateString()
    const idx   = list.findIndex(e => e.type === 'water' && new Date(e.date).toDateString() === today)
    if (idx >= 0) {
      list[idx].ml = (list[idx].ml || 0) + ml
      return storageSet(HEALTH_KEY, list)
    }
    const item = { id: generateId(), date: new Date().toISOString(), type: 'water', ml }
    list.unshift(item)
    storageSet(HEALTH_KEY, list)
    return item
  },

  getTodayWater() {
    const today = new Date().toDateString()
    const all   = storageGet(HEALTH_KEY, [])
    const entry = all.find(e => e.type === 'water' && new Date(e.date).toDateString() === today)
    return entry?.ml || 0
  },

  getWeightHistory(days = 30) {
    const all  = storageGet(HEALTH_KEY, [])
    const from = new Date(Date.now() - days * 864e5)
    return all
      .filter(e => e.type === 'weight' && new Date(e.date) >= from)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  },

  getLatestWeight() {
    const all = storageGet(HEALTH_KEY, []).filter(e => e.type === 'weight')
    return all.length ? all[0].weight : null
  },

  delete(id) {
    return storageSet(HEALTH_KEY, storageGet(HEALTH_KEY, []).filter(e => e.id !== id))
  },
}

const SLEEP_KEY = STORAGE_KEYS.SLEEP_LOGS

export const sleepService = {
  getAll() { return storageGet(SLEEP_KEY, []) },

  add({ date, bedtime, wakeTime, durationMin, quality, note }) {
    const list = storageGet(SLEEP_KEY, [])
    const item = { id: generateId(), createdAt: new Date().toISOString(), date, bedtime, wakeTime, durationMin, quality: quality || null, note: note || null }
    list.unshift(item)
    storageSet(SLEEP_KEY, list)
    return item
  },

  delete(id) {
    return storageSet(SLEEP_KEY, storageGet(SLEEP_KEY, []).filter(e => e.id !== id))
  },

  getHistory(days = 14) {
    const from = new Date(Date.now() - days * 864e5)
    return storageGet(SLEEP_KEY, [])
      .filter(e => new Date(e.date) >= from)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  },

  getSummary(days = 7) {
    const history = this.getHistory(days)
    if (!history.length) return { avg: null, count: 0, best: null, worst: null }
    const durations = history.map(e => e.durationMin)
    const avg   = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    const best  = Math.max(...durations)
    const worst = Math.min(...durations)
    return { avg, count: history.length, best, worst }
  },

  getTodaySleep() {
    const today = new Date().toISOString().slice(0, 10)
    return storageGet(SLEEP_KEY, []).find(e => e.date === today) || null
  },
}
