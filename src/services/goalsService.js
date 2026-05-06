import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

export const goalsService = {
  getAll: () => storageGet(STORAGE_KEYS.GOALS, []),

  add(goal) {
    const list = storageGet(STORAGE_KEYS.GOALS, [])
    const item = {
      id: generateId(), createdAt: new Date().toISOString(),
      progress: 0, target: 100, unit: '%', ...goal,
    }
    list.unshift(item)
    storageSet(STORAGE_KEYS.GOALS, list)
    return item
  },

  update(id, data) {
    const list = storageGet(STORAGE_KEYS.GOALS, [])
    const idx  = list.findIndex(g => g.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], ...data }
    if (list[idx].progress >= list[idx].target && !list[idx].completedAt)
      list[idx].completedAt = new Date().toISOString()
    return storageSet(STORAGE_KEYS.GOALS, list)
  },

  updateProgress(id, progress) {
    const list = storageGet(STORAGE_KEYS.GOALS, [])
    const idx  = list.findIndex(g => g.id === id)
    if (idx === -1) return false
    list[idx].progress = Math.min(Math.max(0, progress), list[idx].target)
    if (list[idx].progress >= list[idx].target && !list[idx].completedAt)
      list[idx].completedAt = new Date().toISOString()
    return storageSet(STORAGE_KEYS.GOALS, list)
  },

  delete(id) {
    return storageSet(STORAGE_KEYS.GOALS,
      storageGet(STORAGE_KEYS.GOALS, []).filter(g => g.id !== id))
  },

  getSummary() {
    const all = storageGet(STORAGE_KEYS.GOALS, [])
    return {
      total:     all.length,
      completed: all.filter(g => g.progress >= g.target).length,
      active:    all.filter(g => g.progress < g.target).length,
    }
  },
}
