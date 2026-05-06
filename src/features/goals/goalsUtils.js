// goalsUtils.js — Phase 5

import { GOAL_CATEGORIES } from '../../constants/categories.js'

export { GOAL_CATEGORIES }

/** % progress capped 0–100 */
export function calcPct(progress, target) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((progress / target) * 100)))
}

/** Colour token per category */
export const CATEGORY_COLOR = {
  finance:  'var(--accent-green)',
  health:   'var(--accent-rose)',
  career:   'var(--accent-violet2)',
  learning: 'var(--accent-blue)',
  travel:   'var(--accent-teal)',
  relation: 'var(--accent-amber)',
  hobby:    'var(--accent-orange)',
  other:    'var(--text-secondary)',
}

export const FILL_CLASS = {
  finance:  'fill-green',
  health:   'fill-rose',
  career:   'fill-violet',
  learning: 'fill-blue',
  travel:   'fill-teal',
  relation: 'fill-amber',
  hobby:    'fill-rose',
  other:    'fill-violet',
}

export function getCategoryMeta(id) {
  return GOAL_CATEGORIES.find(c => c.id === id) ?? { id, label: id, emoji: '⭐' }
}

/** Days remaining until deadline */
export function daysLeft(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / 864e5)
  return diff
}

/** Format deadline label */
export function deadlineLabel(deadline) {
  if (!deadline) return null
  const d = daysLeft(deadline)
  if (d < 0)  return { text: `เกิน ${Math.abs(d)} วัน`, urgent: true }
  if (d === 0) return { text: 'วันนี้!', urgent: true }
  if (d <= 7)  return { text: `เหลือ ${d} วัน`, urgent: true }
  return { text: `เหลือ ${d} วัน`, urgent: false }
}

/** Validate add/edit form */
export function validateGoal({ title, target, unit }) {
  const errors = {}
  if (!title.trim())           errors.title  = 'กรุณาระบุชื่อเป้าหมาย'
  if (title.trim().length > 80) errors.title = 'ชื่อยาวเกินไป (สูงสุด 80 ตัว)'
  const t = parseFloat(target)
  if (!target || isNaN(t) || t <= 0) errors.target = 'กรุณาระบุเป้าหมายตัวเลข'
  if (!unit.trim())            errors.unit   = 'กรุณาระบุหน่วย'
  return errors
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function formatNum(n) {
  return Number(n).toLocaleString('th-TH', { maximumFractionDigits: 2 })
}
