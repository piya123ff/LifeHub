// financeUtils.js — helpers
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants/categories.js'

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  SAVING_IN: 'SAVING_TRANSFER_IN',
  SAVING_OUT: 'SAVING_TRANSFER_OUT',
}

export function getCategoryMeta(id, type) {
  if (type === 'SAVING_TRANSFER_IN' || type === 'SAVING_TRANSFER_OUT') {
    return { id: 'saving', label: 'การออม', emoji: '🎯' }
  }
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const found = Array.isArray(list) ? list.find(c => c.id === id) : null
  return found ?? { id: id || 'other', label: id || 'ทั่วไป', emoji: type === 'income' ? '💰' : '📦' }
}

export function getTransactionTypeBadge(type) {
  switch (type) {
    case 'income':
      return { label: 'รายรับ', color: 'green', icon: '+', prefix: '+' }
    case 'expense':
      return { label: 'รายจ่าย', color: 'rose', icon: '-', prefix: '-' }
    case 'SAVING_TRANSFER_IN':
      return { label: 'แบ่งเงินออม', color: 'amber', icon: '↗', prefix: '↗' }
    case 'SAVING_TRANSFER_OUT':
      return { label: 'ถอนจากเงินออม', color: 'blue', icon: '↙', prefix: '↙' }
    default:
      return { label: 'รายการ', color: 'violet', icon: '•', prefix: '' }
  }
}

export function formatDateTH(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return String(isoString)
    return d.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return String(isoString || '')
  }
}

export function formatDateTimeTH(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return String(isoString)
    return d.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return String(isoString || '')
  }
}


export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function getMonthOptions(n = 12) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    return { value, label }
  })
}

export function filterByMonth(entries, ym) {
  if (!ym) return entries
  return entries.filter(e => e.date.slice(0, 7) === ym)
}

export function computeSummary(entries) {
  const income  = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0)
  const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0)
  return { income, expense, balance: income - expense }
}

export function validateEntry({ name, amount, category, date }) {
  const errors = {}
  if (!name || !name.trim()) errors.name = 'กรุณาระบุชื่อรายการ'
  const num = parseFloat(String(amount).replace(/,/g, ''))
  if (!amount || isNaN(num) || num <= 0) errors.amount = 'กรุณาระบุจำนวนเงินที่ถูกต้อง'
  if (!category) errors.category = 'กรุณาเลือกหมวดหมู่'
  if (!date)     errors.date     = 'กรุณาระบุวันที่'
  return errors
}

/* ══════════════════════════════════════════════════════
   SPLIT BILL HELPERS
══════════════════════════════════════════════════════ */

export function computeSplitBill(totalAmount, participants, paidById) {
  if (!participants || participants.length < 2) return { amountPerPerson: 0, settlements: [] }
  const total = parseFloat(String(totalAmount).replace(/,/g, '')) || 0
  const amountPerPerson = Math.round((total / participants.length) * 100) / 100
  const paidByPerson = participants.find(p => p.id === paidById)
  const settlements = participants
    .filter(p => p.id !== paidById)
    .map(p => ({ from: p.name, to: paidByPerson ? paidByPerson.name : '?', amount: amountPerPerson }))
  return { amountPerPerson, settlements }
}

export function validateSplitBill({ title, totalAmount, participants }) {
  const errors = {}
  if (!title || !title.trim()) errors.title = 'กรุณาระบุชื่อรายการ'
  const num = parseFloat(String(totalAmount).replace(/,/g, ''))
  if (!totalAmount || isNaN(num) || num <= 0) errors.totalAmount = 'กรุณาระบุยอดรวมที่ถูกต้อง'
  if (!participants || participants.length < 2) errors.participants = 'ต้องมีผู้เข้าร่วมอย่างน้อย 2 คน'
  return errors
}

/* ══════════════════════════════════════════════════════
   PARTICIPANT SUMMARY — สรุปยอดรวมรายบุคคล
══════════════════════════════════════════════════════ */

/**
 * Compute per-participant balance summary across all split bills.
 * Returns array of { name, paidTotal, owesTotal, owedTotal, netBalance }
 * netBalance > 0 = others owe you | netBalance < 0 = you owe others
 */
export function computeParticipantSummary(bills) {
  const map = {}

  const ensure = (name) => {
    if (!map[name]) map[name] = { name, paidTotal: 0, owesTotal: 0, owedTotal: 0 }
  }

  bills.forEach(bill => {
    const payer = bill.participants.find(p => p.id === bill.paidBy)
    bill.participants.forEach(p => ensure(p.name))

    // payer paid the full bill upfront
    if (payer) {
      map[payer.name].paidTotal += bill.totalAmount
    }

    // settlements: from owes to
    ;(bill.settlements || []).forEach(s => {
      ensure(s.from)
      ensure(s.to)
      map[s.from].owesTotal += s.amount
      map[s.to].owedTotal   += s.amount
    })
  })

  return Object.values(map)
    .map(b => ({ ...b, netBalance: b.owedTotal - b.owesTotal }))
    .sort((a, b) => b.netBalance - a.netBalance)
}

/* ══════════════════════════════════════════════════════
   NET SETTLEMENT — ยอดสุทธิรายคู่ (ตัดซ้ำซ้อน)
══════════════════════════════════════════════════════ */

/**
 * Compute minimal net settlements across all bills.
 * Nets amounts for each pair to eliminate redundant transfers.
 * Returns array of { key, from, to, amount }
 */
export function computeNetSettlements(bills) {
  // Build raw debt accumulator from ALL bills
  const debt = {}

  bills.forEach(bill => {
    ;(bill.settlements || []).forEach(s => {
      if (!debt[s.from]) debt[s.from] = {}
      debt[s.from][s.to] = (debt[s.from][s.to] || 0) + s.amount
    })
  })

  // Collect unique people
  const people = new Set()
  Object.keys(debt).forEach(from => {
    people.add(from)
    Object.keys(debt[from]).forEach(to => people.add(to))
  })

  const arr = Array.from(people)

  // Net each pair: cancel out opposing debts
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i]
      const b = arr[j]
      const aOwesB = debt[a]?.[b] || 0
      const bOwesA = debt[b]?.[a] || 0

      if (aOwesB > 0 || bOwesA > 0) {
        if (!debt[a]) debt[a] = {}
        if (!debt[b]) debt[b] = {}
        const net = aOwesB - bOwesA
        if (net > 0.005) {
          debt[a][b] = Math.round(net * 100) / 100
          debt[b][a] = 0
        } else if (net < -0.005) {
          debt[b][a] = Math.round(-net * 100) / 100
          debt[a][b] = 0
        } else {
          debt[a][b] = 0
          debt[b][a] = 0
        }
      }
    }
  }

  // Flatten to result list
  const result = []
  Object.keys(debt).forEach(from => {
    Object.keys(debt[from]).forEach(to => {
      if ((debt[from][to] || 0) > 0.005) {
        result.push({
          key:    `${from}___${to}`,
          from,
          to,
          amount: debt[from][to],
        })
      }
    })
  })

  return result.sort((a, b) => b.amount - a.amount)
}
