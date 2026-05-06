import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

export const todoService = {
  getAll: () => storageGet(STORAGE_KEYS.TODOS, []),

  add(todo) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const item = {
      id: generateId(), createdAt: new Date().toISOString(),
      completed: false, priority: 'medium', ...todo,
    }
    list.unshift(item)
    storageSet(STORAGE_KEYS.TODOS, list)
    return item
  },

  toggle(id) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const idx  = list.findIndex(t => t.id === id)
    if (idx === -1) return false
    list[idx].completed   = !list[idx].completed
    list[idx].completedAt = list[idx].completed ? new Date().toISOString() : null
    return storageSet(STORAGE_KEYS.TODOS, list)
  },

  update(id, data) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const idx  = list.findIndex(t => t.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], ...data }
    return storageSet(STORAGE_KEYS.TODOS, list)
  },

  delete(id) {
    return storageSet(STORAGE_KEYS.TODOS,
      storageGet(STORAGE_KEYS.TODOS, []).filter(t => t.id !== id))
  },

  getSummary() {
    const list      = storageGet(STORAGE_KEYS.TODOS, [])
    const total     = list.length
    const completed = list.filter(t => t.completed).length
    const today     = new Date().toDateString()
    const dueToday  = list.filter(t =>
      t.dueDate && new Date(t.dueDate).toDateString() === today && !t.completed
    ).length
    return { total, completed, pending: total - completed, dueToday }
  },
}
