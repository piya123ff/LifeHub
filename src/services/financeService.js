import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

const SPLIT_KEY       = 'lifehub_split_bills'
const NET_SETTLED_KEY = 'lifehub_net_settled'

export const financeService = {
  /* ── Finance entries ───────────────────────────────── */
  getAll: () => storageGet(STORAGE_KEYS.FINANCE, []),

  add(entry) {
    const list = storageGet(STORAGE_KEYS.FINANCE, [])
    const item = { id: generateId(), date: new Date().toISOString(), ...entry }
    list.unshift(item)
    storageSet(STORAGE_KEYS.FINANCE, list)
    return item
  },

  update(id, data) {
    const list = storageGet(STORAGE_KEYS.FINANCE, [])
    const idx  = list.findIndex(e => e.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], ...data }
    return storageSet(STORAGE_KEYS.FINANCE, list)
  },

  delete(id) {
    return storageSet(STORAGE_KEYS.FINANCE,
      storageGet(STORAGE_KEYS.FINANCE, []).filter(e => e.id !== id))
  },

  getMonthlySummary(date = new Date()) {
    const all = storageGet(STORAGE_KEYS.FINANCE, [])
    const month = all.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    })
    const income  = month.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
    const expense = month.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
    return { income, expense, balance: income - expense, count: month.length }
  },

  getMonthlyChart(months = 6) {
    const all = storageGet(STORAGE_KEYS.FINANCE, [])
    const now = new Date()
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      const label = d.toLocaleDateString('th-TH', { month: 'short' })
      const rows = all.filter(e => {
        const ed = new Date(e.date)
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
      })
      return {
        month:   label,
        income:  rows.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
        expense: rows.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
      }
    })
  },

  getCategoryBreakdown(type = 'expense', date = new Date()) {
    const all = storageGet(STORAGE_KEYS.FINANCE, [])
    const rows = all.filter(e => {
      const d = new Date(e.date)
      return e.type === type &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
    })
    const map = {}
    rows.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  },

  /* ── Split Bills ────────────────────────────────────── */
  getSplitBills() {
    return storageGet(SPLIT_KEY, [])
  },

  addSplitBill(bill) {
    const list = storageGet(SPLIT_KEY, [])
    const item = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      isSettled: false,
      addedToFinance: false,
      ...bill,
    }
    list.unshift(item)
    storageSet(SPLIT_KEY, list)
    return item
  },

  deleteSplitBill(id) {
    return storageSet(SPLIT_KEY,
      storageGet(SPLIT_KEY, []).filter(b => b.id !== id))
  },

  settleSplitBill(id) {
    const list = storageGet(SPLIT_KEY, [])
    const idx  = list.findIndex(b => b.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], isSettled: true }
    return storageSet(SPLIT_KEY, list)
  },

  markAddedToFinance(id) {
    const list = storageGet(SPLIT_KEY, [])
    const idx  = list.findIndex(b => b.id === id)
    if (idx === -1) return false
    list[idx] = { ...list[idx], addedToFinance: true }
    return storageSet(SPLIT_KEY, list)
  },

  /* ── Net Settlements (per-pair tracking) ────────────── */

  /** Returns map of { [key]: { isSettled, settledAt } } */
  getNetSettled() {
    return storageGet(NET_SETTLED_KEY, {})
  },

  /** Mark a net settlement pair as received/paid */
  markNetSettled(key) {
    const map = storageGet(NET_SETTLED_KEY, {})
    map[key] = { isSettled: true, settledAt: new Date().toISOString() }
    storageSet(NET_SETTLED_KEY, map)
  },

  /** Unmark a net settlement (revert to unpaid) */
  unmarkNetSettled(key) {
    const map = storageGet(NET_SETTLED_KEY, {})
    delete map[key]
    storageSet(NET_SETTLED_KEY, map)
  },
}
