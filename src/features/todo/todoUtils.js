// todoUtils.js — Phase 3 helpers

/** Priority metadata */
export const PRIORITIES = [
  { id: 'high',   label: 'สูง',   emoji: '🔴', color: 'var(--accent-rose)'   },
  { id: 'medium', label: 'กลาง',  emoji: '🟡', color: 'var(--accent-amber)'  },
  { id: 'low',    label: 'ต่ำ',   emoji: '🟢', color: 'var(--accent-green)'  },
]

/** Todo categories */
export const TODO_CATEGORIES = [
  { id: 'work',     label: 'งาน',       emoji: '💼' },
  { id: 'study',    label: 'เรียน',     emoji: '📚' },
  { id: 'personal', label: 'ส่วนตัว',  emoji: '🏠' },
  { id: 'health',   label: 'สุขภาพ',   emoji: '❤️' },
  { id: 'finance',  label: 'การเงิน',  emoji: '💰' },
  { id: 'social',   label: 'สังคม',    emoji: '👥' },
  { id: 'other',    label: 'อื่นๆ',    emoji: '📌' },
]

/** Get priority meta by id */
export function getPriorityMeta(id) {
  return PRIORITIES.find(p => p.id === id) ?? PRIORITIES[1]
}

/** Get category meta by id */
export function getCategoryMeta(id) {
  return TODO_CATEGORIES.find(c => c.id === id) ?? { id, label: id, emoji: '📌' }
}

/** Today as YYYY-MM-DD */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Format date string → Thai locale short */
export function formatDateTH(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Check if a dueDate is overdue (past today and not completed) */
export function isOverdue(todo) {
  if (todo.completed || !todo.dueDate) return false
  return new Date(todo.dueDate) < new Date(new Date().toDateString())
}

/** Check if dueDate is today */
export function isDueToday(todo) {
  if (todo.completed || !todo.dueDate) return false
  return new Date(todo.dueDate).toDateString() === new Date().toDateString()
}

/** Filter & sort todos based on active tab and filters */
export function applyFilters(todos, { tab, category, priority, search }) {
  let list = [...todos]

  // Tab filter
  if (tab === 'pending')   list = list.filter(t => !t.completed)
  if (tab === 'completed') list = list.filter(t => t.completed)

  // Category filter
  if (category) list = list.filter(t => t.category === category)

  // Priority filter
  if (priority) list = list.filter(t => t.priority === priority)

  // Search
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(t => t.title.toLowerCase().includes(q))
  }

  // Sort: pending first by priority order, then by createdAt desc
  const pOrder = { high: 0, medium: 1, low: 2 }
  list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (!a.completed && !b.completed) {
      // overdue first
      const ao = isOverdue(a), bo = isOverdue(b)
      if (ao !== bo) return ao ? -1 : 1
      // then by priority
      if (a.priority !== b.priority)
        return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1)
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return list
}

/** Validate add/edit form */
export function validateTodo({ title }) {
  const errors = {}
  if (!title.trim()) errors.title = 'กรุณาระบุชื่องาน'
  if (title.trim().length > 120) errors.title = 'ชื่องานยาวเกินไป (สูงสุด 120 ตัวอักษร)'
  return errors
}
