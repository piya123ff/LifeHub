import { storageGet, storageSet, STORAGE_KEYS, generateId } from './storageService.js'

const SPLIT_KEY       = 'lifehub_split_bills'
const NET_SETTLED_KEY = 'lifehub_net_settled'

export const financeService = {
  /* ── Finance entries (Transactions) ─────────────────── */
  getAll: () => storageGet(STORAGE_KEYS.FINANCE, []),

  add(entry) {
    const list = storageGet(STORAGE_KEYS.FINANCE, [])
    const item = {
      id: generateId(),
      date: entry.date || new Date().toISOString(),
      note: '',
      ...entry,
    }
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
    const list = storageGet(STORAGE_KEYS.FINANCE, [])
    const target = list.find(e => e.id === id)
    if (!target) return false

    // If deleting a saving transfer, automatically sync the goal's saved amount
    if (target.type === 'SAVING_TRANSFER_IN' && target.goalId) {
      const goals = this.getSavingGoals()
      const gIdx = goals.findIndex(g => g.id === target.goalId)
      if (gIdx !== -1) {
        goals[gIdx].savedAmount = Math.max(0, Number(goals[gIdx].savedAmount || 0) - Number(target.amount || 0))
        storageSet(STORAGE_KEYS.SAVING_GOALS, goals)
      }
    } else if (target.type === 'SAVING_TRANSFER_OUT' && target.goalId) {
      const goals = this.getSavingGoals()
      const gIdx = goals.findIndex(g => g.id === target.goalId)
      if (gIdx !== -1) {
        goals[gIdx].savedAmount = Number(goals[gIdx].savedAmount || 0) + Number(target.amount || 0)
        storageSet(STORAGE_KEYS.SAVING_GOALS, goals)
      }
    }

    return storageSet(STORAGE_KEYS.FINANCE, list.filter(e => e.id !== id))
  },

  /* ── Savings Goals ─────────────────────────────────────
     Savings are allocations of existing money, never expenses or income.
  ─────────────────────────────────────────────────────── */
  getSavingGoals() {
    return storageGet(STORAGE_KEYS.SAVING_GOALS, [])
  },

  addSavingGoal(goal) {
    const goals = this.getSavingGoals()
    const initial = Number(goal.initialAmount || 0)
    const item = {
      id: generateId(),
      name: goal.name || '',
      targetAmount: Number(goal.targetAmount || 0),
      savedAmount: 0,
      icon: goal.icon || '🎯',
      targetDate: goal.targetDate || '',
      note: goal.note || '',
      createdAt: new Date().toISOString(),
    }
    goals.unshift(item)
    storageSet(STORAGE_KEYS.SAVING_GOALS, goals)

    // If there is an initial amount and enough available balance, allocate it
    if (initial > 0) {
      this.allocateToSaving(item.id, initial, 'เงินเริ่มต้นเป้าหมาย')
    }

    return item
  },

  updateSavingGoal(id, data) {
    const goals = this.getSavingGoals()
    const index = goals.findIndex(goal => goal.id === id)
    if (index === -1) return false
    goals[index] = { ...goals[index], ...data }
    return storageSet(STORAGE_KEYS.SAVING_GOALS, goals)
  },

  deleteSavingGoal(id, refundToAvailable = true) {
    const goals = this.getSavingGoals()
    const goal = goals.find(g => g.id === id)
    if (!goal) return false

    if (refundToAvailable && Number(goal.savedAmount || 0) > 0) {
      this.add({
        type: 'SAVING_TRANSFER_OUT',
        amount: Number(goal.savedAmount || 0),
        goalId: id,
        goalName: goal.name,
        name: `คืนเงินจากการลบเป้าหมาย "${goal.name}"`,
        category: 'saving',
        date: new Date().toISOString(),
        note: 'คืนเงินเข้าสู่เงินที่ใช้ได้เนื่องจากลบเป้าหมาย',
      })
    }

    return storageSet(
      STORAGE_KEYS.SAVING_GOALS,
      goals.filter(g => g.id !== id)
    )
  },

  /* ── Balance Calculations ──────────────────────────────
     Total Balance     = Total Income - Total Expense
     Total Savings     = Sum of savedAmount in all goals
     Available Balance = Total Balance - Total Savings
  ─────────────────────────────────────────────────────── */
  getBalances() {
    const entries = this.getAll()
    const income = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const expense = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const savings = this.getSavingGoals()
      .reduce((sum, goal) => sum + Number(goal.savedAmount || 0), 0)

    const total = income - expense
    const available = total - savings

    // Current month calculations
    const now = new Date()
    const thisMonthEntries = entries.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const thisMonthIncome = thisMonthEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const thisMonthExpense = thisMonthEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)

    return {
      income,
      expense,
      savings,
      total,
      available,
      thisMonthIncome,
      thisMonthExpense,
    }
  },

  /* ── Allocate money from Available Balance into a Goal ─ */
  allocateToSaving(goalId, amount, note = '', date = new Date().toISOString()) {
    const value = Number(amount)
    const balances = this.getBalances()
    const goal = this.getSavingGoals().find(item => item.id === goalId)

    if (!goal || !Number.isFinite(value) || value <= 0 || value > balances.available) {
      return { ok: false, error: 'จำนวนเงินไม่เพียงพอหรือไม่ถูกต้อง' }
    }

    this.updateSavingGoal(goalId, {
      savedAmount: Number(goal.savedAmount || 0) + value,
    })

    const entry = this.add({
      type: 'SAVING_TRANSFER_IN',
      amount: value,
      goalId,
      goalName: goal.name,
      name: `แบ่งเงินไป "${goal.name}"`,
      category: 'saving',
      note,
      date,
    })

    return { ok: true, entry }
  },

  /* ── Withdraw money from a Goal back to Available Balance ─ */
  withdrawFromSaving(goalId, amount, note = '', date = new Date().toISOString()) {
    const value = Number(amount)
    const goal = this.getSavingGoals().find(item => item.id === goalId)

    if (!goal || !Number.isFinite(value) || value <= 0 || value > Number(goal.savedAmount || 0)) {
      return { ok: false, error: 'ยอดเงินในเป้าหมายไม่เพียงพอหรือไม่ถูกต้อง' }
    }

    this.updateSavingGoal(goalId, {
      savedAmount: Number(goal.savedAmount || 0) - value,
    })

    const entry = this.add({
      type: 'SAVING_TRANSFER_OUT',
      amount: value,
      goalId,
      goalName: goal.name,
      name: `โยกเงินจาก "${goal.name}"`,
      category: 'saving',
      note,
      date,
    })

    return { ok: true, entry }
  },

  /* ── Goal History ────────────────────────────────────── */
  getGoalHistory(goalId) {
    return this.getAll().filter(e => e.goalId === goalId)
  },

  /* ── Monthly Summary & Charts (Strictly Income / Expense) ── */
  getMonthlySummary(date = new Date()) {
    const all = storageGet(STORAGE_KEYS.FINANCE, [])
    const month = all.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    })
    const income  = month.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0)
    const expense = month.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0)
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
        income:  rows.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0),
        expense: rows.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0),
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
    rows.forEach(e => {
      const cat = e.category || 'other'
      map[cat] = (map[cat] || 0) + Number(e.amount || 0)
    })
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
  getNetSettled() {
    return storageGet(NET_SETTLED_KEY, {})
  },

  markNetSettled(key) {
    const map = storageGet(NET_SETTLED_KEY, {})
    map[key] = { isSettled: true, settledAt: new Date().toISOString() }
    storageSet(NET_SETTLED_KEY, map)
  },

  unmarkNetSettled(key) {
    const map = storageGet(NET_SETTLED_KEY, {})
    delete map[key]
    storageSet(NET_SETTLED_KEY, map)
  },

  /* ── Budgets ─────────────────────────────────────────
     เก็บ { [categoryId]: limitAmount }
  ─────────────────────────────────────────────────────── */
  getBudgets() {
    return storageGet(STORAGE_KEYS.BUDGETS, {})
  },

  setBudget(categoryId, amount) {
    const budgets = storageGet(STORAGE_KEYS.BUDGETS, {})
    if (!amount || amount <= 0) {
      delete budgets[categoryId]
    } else {
      budgets[categoryId] = amount
    }
    return storageSet(STORAGE_KEYS.BUDGETS, budgets)
  },

  deleteBudget(categoryId) {
    const budgets = storageGet(STORAGE_KEYS.BUDGETS, {})
    delete budgets[categoryId]
    return storageSet(STORAGE_KEYS.BUDGETS, budgets)
  },

  /* คืน array ของทุก expense category พร้อม spent/limit/pct เดือนนี้ */
  getBudgetStatus(date = new Date()) {
    const budgets  = storageGet(STORAGE_KEYS.BUDGETS, {})
    const breakdown = this.getCategoryBreakdown('expense', date)
    const spentMap  = {}
    breakdown.forEach(({ category, amount }) => { spentMap[category] = amount })

    // รวมทุก category ที่มี limit หรือมีการใช้จ่าย
    const allCats = new Set([
      ...Object.keys(budgets),
      ...Object.keys(spentMap),
    ])

    return Array.from(allCats).map(cat => {
      const spent = spentMap[cat] || 0
      const limit = budgets[cat] || 0
      const pct   = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 999) : null
      return { category: cat, spent, limit, pct, hasLimit: limit > 0 }
    }).sort((a, b) => {
      // เรียง: มี limit + ใช้เกินก่อน → มี limit → ไม่มี limit
      if (a.hasLimit && !b.hasLimit) return -1
      if (!a.hasLimit && b.hasLimit) return 1
      if (a.hasLimit && b.hasLimit) return (b.pct || 0) - (a.pct || 0)
      return b.spent - a.spent
    })
  },
}
