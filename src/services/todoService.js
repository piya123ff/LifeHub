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

// Sub-task helpers — sub-tasks stored inside each todo as todo.subTasks = [{id, title, completed}]
export const subTaskService = {
  add(todoId, title) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const idx  = list.findIndex(t => t.id === todoId)
    if (idx === -1) return false
    if (!list[idx].subTasks) list[idx].subTasks = []
    list[idx].subTasks.push({ id: generateId(), title: title.trim(), completed: false })
    return storageSet(STORAGE_KEYS.TODOS, list)
  },

  toggle(todoId, subId) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const todo = list.find(t => t.id === todoId)
    if (!todo?.subTasks) return false
    const sub = todo.subTasks.find(s => s.id === subId)
    if (sub) sub.completed = !sub.completed
    return storageSet(STORAGE_KEYS.TODOS, list)
  },

  delete(todoId, subId) {
    const list = storageGet(STORAGE_KEYS.TODOS, [])
    const todo = list.find(t => t.id === todoId)
    if (!todo?.subTasks) return false
    todo.subTasks = todo.subTasks.filter(s => s.id !== subId)
    return storageSet(STORAGE_KEYS.TODOS, list)
  },
}
