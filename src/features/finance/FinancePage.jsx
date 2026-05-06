import React, { useState, useCallback, useMemo } from 'react'
import { financeService }  from '../../services/financeService.js'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants/categories.js'
import { formatMoney }     from '../../utils/formatMoney.js'
import {
  getCategoryMeta, formatDateTH, todayISO,
  getMonthOptions, filterByMonth, computeSummary, validateEntry,
  computeSplitBill, validateSplitBill,
  computeParticipantSummary, computeNetSettlements,
} from './financeUtils.js'
import './FinancePage.css'

/* ─────────────────────────────────────────────────────────
   Shared micro-components
───────────────────────────────────────────────────────── */

function TypeToggle({ value, onChange }) {
  return (
    <div className="type-toggle" role="group" aria-label="ประเภทรายการ">
      <button type="button"
        className={"type-btn " + (value === 'income' ? 'active-income' : '')}
        onClick={() => onChange('income')} aria-pressed={value === 'income'}>
        <span>💚</span> รายรับ
      </button>
      <button type="button"
        className={"type-btn " + (value === 'expense' ? 'active-expense' : '')}
        onClick={() => onChange('expense')} aria-pressed={value === 'expense'}>
        <span>🔴</span> รายจ่าย
      </button>
    </div>
  )
}

function CategoryGrid({ type, selected, onSelect, error }) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return (
    <div className="field">
      <label className="field-label">หมวดหมู่</label>
      <div className="category-grid" role="listbox" aria-label="เลือกหมวดหมู่">
        {cats.map(c => (
          <button key={c.id} type="button" role="option"
            aria-selected={selected === c.id}
            className={"cat-chip " + (selected === c.id ? 'cat-chip--active' : '') + " " + (selected === c.id && type === 'income' ? 'income-active' : '') + " " + (selected === c.id && type === 'expense' ? 'expense-active' : '')}
            onClick={() => onSelect(c.id)}>
            <span className="cat-chip-emoji">{c.emoji}</span>
            <span className="cat-chip-label">{c.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function SummaryCard({ label, value, accent, icon }) {
  return (
    <div className={"fin-summary-card accent-" + accent}>
      <div className="fin-summary-icon">{icon}</div>
      <div>
        <p className="fin-summary-label">{label}</p>
        <p className="fin-summary-value">{value}</p>
      </div>
    </div>
  )
}

function TxRow({ entry, onDelete }) {
  const meta = getCategoryMeta(entry.category, entry.type)
  const isIncome = entry.type === 'income'
  const displayName = entry.name || meta.label
  return (
    <div className="tx-row">
      <div className="tx-cat-icon">{meta.emoji}</div>
      <div className="tx-info">
        <span className="tx-name">{displayName}</span>
        <div className="tx-meta-row">
          <span className="tx-cat-badge">{meta.label}</span>
          <span className="tx-date">{formatDateTH(entry.date)}</span>
        </div>
        {entry.note && <span className="tx-note">{entry.note}</span>}
      </div>
      <div className="tx-right">
        <span className={"tx-amount " + (isIncome ? 'tx-income' : 'tx-expense')}>
          {isIncome ? '+' : '-'}{formatMoney(entry.amount)}
        </span>
        <button className="tx-delete" onClick={() => onDelete(entry.id)}
          aria-label={"ลบรายการ " + displayName} title="ลบรายการ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Mode-toggle tabs
───────────────────────────────────────────────────────── */

function FinanceModeTabs({ mode, onChange }) {
  return (
    <div className="fin-mode-tabs">
      <button type="button"
        className={"fin-mode-tab " + (mode === 'finance' ? 'fin-mode-tab--active' : '')}
        onClick={() => onChange('finance')}>
        💰 รายรับ / รายจ่าย
      </button>
      <button type="button"
        className={"fin-mode-tab " + (mode === 'split' ? 'fin-mode-tab--active' : '')}
        onClick={() => onChange('split')}>
        🤝 หารบิล
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Split Bill Form
───────────────────────────────────────────────────────── */

const EMPTY_SPLIT = {
  title: '',
  totalAmount: '',
  participants: [{ id: 'p1', name: '' }, { id: 'p2', name: '' }],
  paidBy: 'p1',
  date: todayISO(),
  note: '',
}

function SplitBillForm({ onSaved, showFlash }) {
  const [form,   setForm]   = useState(EMPTY_SPLIT)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const preview = useMemo(() => {
    const total = parseFloat(String(form.totalAmount).replace(/,/g, ''))
    if (!total || form.participants.length < 2 || form.participants.some(p => !p.name.trim())) return null
    return computeSplitBill(total, form.participants.filter(p => p.name.trim()), form.paidBy)
  }, [form.totalAmount, form.participants, form.paidBy])

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function addParticipant() {
    const id = 'p' + Date.now()
    setForm(f => ({ ...f, participants: [...f.participants, { id, name: '' }] }))
  }

  function removeParticipant(id) {
    setForm(f => {
      const next = f.participants.filter(p => p.id !== id)
      return { ...f, participants: next, paidBy: next.find(p => p.id === f.paidBy) ? f.paidBy : next[0]?.id ?? '' }
    })
  }

  function setParticipantName(id, name) {
    setForm(f => ({
      ...f,
      participants: f.participants.map(p => p.id === id ? { ...p, name } : p),
    }))
    if (errors.participants) setErrors(e => ({ ...e, participants: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validParticipants = form.participants.filter(p => p.name.trim())
    const errs = validateSplitBill({ title: form.title, totalAmount: form.totalAmount, participants: validParticipants })
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const total = parseFloat(String(form.totalAmount).replace(/,/g, ''))
    const { amountPerPerson, settlements } = computeSplitBill(total, validParticipants, form.paidBy)
    financeService.addSplitBill({
      title:           form.title.trim(),
      totalAmount:     total,
      participants:    validParticipants,
      paidBy:          form.paidBy,
      date:            new Date(form.date).toISOString(),
      note:            form.note.trim(),
      amountPerPerson,
      settlements,
    })
    setForm(EMPTY_SPLIT)
    setErrors({})
    setSaving(false)
    showFlash('✅ บันทึกบิลแล้ว')
    onSaved()
  }

  const validParticipants = form.participants.filter(p => p.name.trim())

  return (
    <div className="card card-pad-lg fin-form-card">
      <h2 className="fin-form-title">🤝 หารบิล</h2>
      <form onSubmit={handleSubmit} noValidate className="fin-form">

        <div className="field">
          <label className="field-label" htmlFor="sb-title">ชื่อรายการ</label>
          <input id="sb-title"
            className={"input " + (errors.title ? 'input-error' : '')}
            type="text"
            placeholder="เช่น ค่าอาหาร, ค่าแท็กซี่..."
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            autoComplete="off" />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="sb-amount">ยอดรวม (บาท)</label>
          <div className="field-wrap has-prefix">
            <span className="field-prefix fin-baht">฿</span>
            <input id="sb-amount"
              className={"input fin-amount-input " + (errors.totalAmount ? 'input-error' : '')}
              type="number" inputMode="decimal" min="0" step="0.01" placeholder="0"
              value={form.totalAmount}
              onChange={e => setField('totalAmount', e.target.value)}
              autoComplete="off" />
          </div>
          {errors.totalAmount && <p className="field-error">{errors.totalAmount}</p>}
        </div>

        <div className="field">
          <label className="field-label">ผู้เข้าร่วม ({form.participants.length} คน)</label>
          <div className="sb-participants">
            {form.participants.map((p, i) => (
              <div key={p.id} className="sb-participant-row">
                <span className="sb-participant-num">{i + 1}</span>
                <input className="input sb-participant-input" type="text"
                  placeholder={"ชื่อคนที่ " + (i + 1)}
                  value={p.name}
                  onChange={e => setParticipantName(p.id, e.target.value)}
                  autoComplete="off" />
                {form.participants.length > 2 && (
                  <button type="button" className="sb-remove-btn"
                    onClick={() => removeParticipant(p.id)} title="ลบ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="sb-add-participant-btn" onClick={addParticipant}>
              + เพิ่มคน
            </button>
          </div>
          {errors.participants && <p className="field-error">{errors.participants}</p>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="sb-paid-by">ใครจ่ายก่อน</label>
          <select id="sb-paid-by" className="input" value={form.paidBy}
            onChange={e => setField('paidBy', e.target.value)}>
            {form.participants.filter(p => p.name.trim()).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {validParticipants.length === 0 && (
              <option value="">— ระบุชื่อก่อน —</option>
            )}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="sb-date">วันที่</label>
          <div className="field-wrap">
            <input id="sb-date" className="input" type="date"
              value={form.date} max={todayISO()}
              onChange={e => setField('date', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="sb-note">หมายเหตุ (ไม่บังคับ)</label>
          <textarea id="sb-note" className="input textarea"
            placeholder="เช่น มื้อค่ำวันเกิด..."
            value={form.note} rows={2}
            onChange={e => setField('note', e.target.value)} />
        </div>

        {preview && (
          <div className="sb-preview">
            <p className="sb-preview-title">📊 ตัวอย่างการหาร</p>
            <p className="sb-preview-per">คนละ <strong>{formatMoney(preview.amountPerPerson)}</strong> บาท</p>
            <div className="sb-preview-settlements">
              {preview.settlements.map((s, i) => (
                <p key={i} className="sb-settle-line">
                  <span className="sb-from">{s.from}</span>
                  <span className="sb-arrow">→</span>
                  <span className="sb-to">{s.to}</span>
                  <span className="sb-settle-amount">{formatMoney(s.amount)}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="btn btn-primary btn-size-lg fin-submit sb-submit-btn">
          {saving ? '⏳ กำลังบันทึก...' : '🤝 บันทึกบิล'}
        </button>
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Split Bill History
───────────────────────────────────────────────────────── */

function SplitBillHistory({ bills, onReload, showFlash, onAddToFinance }) {
  const [expanded,      setExpanded]      = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function toggleExpand(id) { setExpanded(e => e === id ? null : id) }

  function handleSettle(id) {
    financeService.settleSplitBill(id)
    onReload()
    showFlash('✅ ทำเครื่องหมายชำระแล้ว')
  }

  function handleDelete(id) {
    if (deleteConfirm === id) {
      financeService.deleteSplitBill(id)
      onReload()
      setDeleteConfirm(null)
      showFlash('🗑️ ลบบิลแล้ว', false)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function handleAddToFinance(bill) {
    financeService.add({
      type:     'expense',
      amount:   bill.amountPerPerson,
      category: 'food',
      name:     'หารบิล: ' + bill.title,
      note:     '[หารบิล] ' + bill.title,
      date:     bill.date,
    })
    financeService.markAddedToFinance(bill.id)
    onReload()
    onAddToFinance()
    showFlash('✅ เพิ่มในรายจ่ายแล้ว')
  }

  if (bills.length === 0) {
    return (
      <div className="fin-empty">
        <span className="fin-empty-icon">🤝</span>
        <p>ยังไม่มีบิลที่บันทึกไว้</p>
        <span>เพิ่มบิลด้านซ้ายเพื่อเริ่มต้น</span>
      </div>
    )
  }

  return (
    <div className="sb-history-list">
      {bills.map(bill => (
        <div key={bill.id} className={"sb-bill-card " + (bill.isSettled ? 'sb-bill-card--settled' : '')}>
          <div className="sb-bill-header" onClick={() => toggleExpand(bill.id)} role="button"
            tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleExpand(bill.id)}>
            <div className="sb-bill-meta">
              <span className="sb-bill-icon">{bill.isSettled ? '✅' : '🤝'}</span>
              <div>
                <p className="sb-bill-title">{bill.title}</p>
                <p className="sb-bill-date">{formatDateTH(bill.date)} · {bill.participants.length} คน</p>
              </div>
            </div>
            <div className="sb-bill-right">
              <div className="sb-bill-amounts">
                <p className="sb-bill-total">฿{formatMoney(bill.totalAmount)}</p>
                <p className="sb-bill-per">คนละ ฿{formatMoney(bill.amountPerPerson)}</p>
              </div>
              <svg className={"sb-chevron " + (expanded === bill.id ? 'sb-chevron--open' : '')}
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {expanded === bill.id && (
            <div className="sb-bill-detail">
              <p className="sb-detail-label">การโอนเงิน</p>
              <div className="sb-preview-settlements">
                {bill.settlements.map((s, i) => (
                  <p key={i} className="sb-settle-line">
                    <span className="sb-from">{s.from}</span>
                    <span className="sb-arrow">→</span>
                    <span className="sb-to">{s.to}</span>
                    <span className="sb-settle-amount">{formatMoney(s.amount)}</span>
                  </p>
                ))}
              </div>

              <p className="sb-detail-label">ผู้เข้าร่วม</p>
              <div className="sb-participants-chips">
                {bill.participants.map(p => (
                  <span key={p.id} className={"sb-name-chip " + (p.id === bill.paidBy ? 'sb-name-chip--payer' : '')}>
                    {p.name}{p.id === bill.paidBy ? ' (จ่ายแล้ว)' : ''}
                  </span>
                ))}
              </div>

              {bill.note && <p className="sb-bill-note">{bill.note}</p>}

              <div className="sb-bill-actions">
                {!bill.isSettled && (
                  <button type="button" className="btn btn-ghost btn-size-sm sb-action-btn"
                    onClick={() => handleSettle(bill.id)}>
                    ✅ ชำระแล้ว
                  </button>
                )}
                {!bill.addedToFinance && (
                  <button type="button" className="btn btn-ghost btn-size-sm sb-action-btn"
                    onClick={() => handleAddToFinance(bill)}>
                    💳 เพิ่มในรายจ่าย
                  </button>
                )}
                {bill.addedToFinance && (
                  <span className="sb-added-badge">💳 อยู่ในรายจ่ายแล้ว</span>
                )}
                <button type="button"
                  className={"btn btn-size-sm sb-action-btn " + (deleteConfirm === bill.id ? 'btn-danger' : 'btn-ghost')}
                  onClick={() => handleDelete(bill.id)}>
                  {deleteConfirm === bill.id ? 'ยืนยันลบ?' : '🗑️ ลบ'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


/* ─────────────────────────────────────────────────────────
   Split Bill Participant Summary
───────────────────────────────────────────────────────── */

function SplitBillSummary({ bills, onSettleChange }) {
  const [settled, setSettled] = React.useState(() => financeService.getNetSettled())

  const participants = React.useMemo(() => computeParticipantSummary(bills), [bills])
  const settlements  = React.useMemo(() => computeNetSettlements(bills), [bills])

  function handleToggle(key) {
    const current = settled[key]?.isSettled
    if (current) {
      financeService.unmarkNetSettled(key)
    } else {
      financeService.markNetSettled(key)
    }
    setSettled(financeService.getNetSettled())
    if (onSettleChange) onSettleChange()
  }

  if (bills.length === 0) {
    return (
      <div className="sbs-empty">
        <span className="sbs-empty-icon">📊</span>
        <p>ยังไม่มีข้อมูลผู้เข้าร่วม</p>
        <span>เพิ่มบิลก่อนเพื่อดูสรุปรายบุคคล</span>
      </div>
    )
  }

  return (
    <div className="sbs-wrapper">
      {/* Participant cards */}
      <div className="sbs-section">
        <p className="section-label sbs-section-label">👤 ยอดรวมรายบุคคล</p>
        <div className="sbs-person-grid">
          {participants.map(p => {
            const isPositive = p.netBalance > 0
            const isNeutral  = Math.abs(p.netBalance) < 0.01
            return (
              <div key={p.name} className="sbs-person-card">
                <div className="sbs-person-avatar">{p.name.slice(0, 1).toUpperCase()}</div>
                <p className="sbs-person-name">{p.name}</p>
                <div className="sbs-person-stats">
                  <div className="sbs-stat">
                    <span className="sbs-stat-label">จ่ายแล้ว</span>
                    <span className="sbs-stat-val sbs-stat-paid">฿{formatMoney(p.paidTotal)}</span>
                  </div>
                  <div className="sbs-stat">
                    <span className="sbs-stat-label">ที่ต้องจ่าย</span>
                    <span className="sbs-stat-val sbs-stat-owes">฿{formatMoney(p.owesTotal)}</span>
                  </div>
                  <div className="sbs-stat">
                    <span className="sbs-stat-label">รอรับคืน</span>
                    <span className="sbs-stat-val sbs-stat-owed">฿{formatMoney(p.owedTotal)}</span>
                  </div>
                </div>
                <div className={"sbs-net-badge " + (isNeutral ? 'sbs-net-zero' : isPositive ? 'sbs-net-pos' : 'sbs-net-neg')}>
                  {isNeutral ? '⚖️ สมดุล' : isPositive ? ('▲ +฿' + formatMoney(p.netBalance)) : ('▼ -฿' + formatMoney(Math.abs(p.netBalance)))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Net settlements */}
      {settlements.length > 0 && (
        <div className="sbs-section">
          <p className="section-label sbs-section-label">💸 ยอดสุทธิที่ต้องโอน</p>
          <div className="sbs-settle-list">
            {settlements.map(s => {
              const isDone = settled[s.key]?.isSettled
              return (
                <div key={s.key} className={"sbs-settle-row " + (isDone ? 'sbs-settle-row--done' : '')}>
                  <div className="sbs-settle-people">
                    <span className="sbs-settle-from">{s.from}</span>
                    <span className="sbs-settle-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </span>
                    <span className="sbs-settle-to">{s.to}</span>
                  </div>
                  <div className="sbs-settle-right">
                    <span className="sbs-settle-amount">฿{formatMoney(s.amount)}</span>
                    <span className={"sbs-settle-badge " + (isDone ? 'sbs-badge-done' : 'sbs-badge-pending')}>
                      {isDone ? '✓ รับแล้ว' : 'รอโอน'}
                    </span>
                    <button type="button"
                      className={"sbs-settle-btn " + (isDone ? 'sbs-btn-undo' : 'sbs-btn-mark')}
                      onClick={() => handleToggle(s.key)}>
                      {isDone ? 'เลิกทำ' : '✓ ได้รับแล้ว'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

const EMPTY_FORM = {
  type: 'expense',
  name: '',
  amount: '',
  category: '',
  date: todayISO(),
  note: '',
}

export default function FinancePage() {
  const [pageMode, setPageMode] = useState('finance')

  const [form,   setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [flash,  setFlash]  = useState(null)

  const monthOptions = useMemo(() => getMonthOptions(12), [])
  const currentMonth = monthOptions[0].value
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [allEntries,    setAllEntries]     = useState(() => financeService.getAll())
  const [deleteConfirm, setDeleteConfirm]  = useState(null)

  const [splitBills, setSplitBills] = useState(() => financeService.getSplitBills())

  const filtered = useMemo(() => filterByMonth(allEntries, selectedMonth), [allEntries, selectedMonth])
  const summary  = useMemo(() => computeSummary(filtered), [filtered])

  const reload      = useCallback(() => setAllEntries(financeService.getAll()), [])
  const reloadSplit = useCallback(() => setSplitBills(financeService.getSplitBills()), [])

  function field(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok })
    setTimeout(() => setFlash(null), 2200)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateEntry(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const amount = parseFloat(String(form.amount).replace(/,/g, ''))
    financeService.add({
      type:     form.type,
      name:     form.name.trim(),
      amount,
      category: form.category,
      note:     form.note.trim(),
      date:     new Date(form.date).toISOString(),
    })
    reload()
    setForm({ ...EMPTY_FORM, type: form.type })
    setErrors({})
    setSaving(false)
    showFlash(form.type === 'income' ? '✅ บันทึกรายรับแล้ว' : '✅ บันทึกรายจ่ายแล้ว')
  }

  function handleDelete(id) {
    if (deleteConfirm === id) {
      financeService.delete(id)
      reload()
      setDeleteConfirm(null)
      showFlash('🗑️ ลบรายการแล้ว', false)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="fin-page">

      {flash && (
        <div className={"fin-toast " + (flash.ok ? 'fin-toast--ok' : 'fin-toast--warn')}>
          {flash.msg}
        </div>
      )}

      {deleteConfirm && (
        <div className="fin-confirm-bar">
          <span>กดปุ่มลบอีกครั้งเพื่อยืนยันการลบรายการนี้</span>
        </div>
      )}

      <FinanceModeTabs mode={pageMode} onChange={setPageMode} />

      <div className="fin-layout">

        {/* LEFT PANEL */}
        <aside className="fin-form-panel">
          {pageMode === 'finance' ? (
            <div className="card card-pad-lg fin-form-card">
              <h2 className="fin-form-title">
                {form.type === 'income' ? '💚 เพิ่มรายรับ' : '🔴 เพิ่มรายจ่าย'}
              </h2>
              <form onSubmit={handleSubmit} noValidate className="fin-form">

                <TypeToggle value={form.type}
                  onChange={v => { field('type', v); field('category', ''); field('name', '') }} />

                {/* ── ชื่อรายการ — บังคับกรอกก่อน ── */}
                <div className="field">
                  <label className="field-label" htmlFor="fin-name">
                    {form.type === 'income' ? '📝 รับค่าอะไร?' : '📝 จ่ายค่าอะไร?'}
                    <span className="field-required">*</span>
                  </label>
                  <input id="fin-name"
                    className={"input fin-name-input " + (errors.name ? 'input-error' : '')}
                    type="text"
                    placeholder={form.type === 'income'
                      ? 'เช่น เงินเดือน, ค่าจ้างงาน, โบนัส...'
                      : 'เช่น ค่าอาหาร, ค่าน้ำมัน, ค่าเช่า...'}
                    value={form.name}
                    onChange={e => field('name', e.target.value)}
                    autoComplete="off"
                    autoFocus />
                  {errors.name && <p className="field-error">{errors.name}</p>}
                </div>

                {/* Amount */}
                <div className="field">
                  <label className="field-label" htmlFor="fin-amount">จำนวนเงิน (บาท)</label>
                  <div className="field-wrap has-prefix">
                    <span className="field-prefix fin-baht">฿</span>
                    <input id="fin-amount"
                      className={"input fin-amount-input " + (errors.amount ? 'input-error' : '')}
                      type="number" inputMode="decimal" min="0" step="0.01" placeholder="0"
                      value={form.amount} onChange={e => field('amount', e.target.value)}
                      autoComplete="off" />
                  </div>
                  {errors.amount && <p className="field-error">{errors.amount}</p>}
                </div>

                <div className="quick-amounts">
                  {[100, 200, 500, 1000, 5000].map(n => (
                    <button key={n} type="button" className="quick-btn"
                      onClick={() => field('amount', String(n))}>
                      ฿{n >= 1000 ? n / 1000 + 'K' : n}
                    </button>
                  ))}
                </div>

                <CategoryGrid type={form.type} selected={form.category}
                  onSelect={v => field('category', v)} error={errors.category} />

                <div className="field">
                  <label className="field-label" htmlFor="fin-date">วันที่</label>
                  <div className="field-wrap">
                    <input id="fin-date"
                      className={"input " + (errors.date ? 'input-error' : '')}
                      type="date" value={form.date} max={todayISO()}
                      onChange={e => field('date', e.target.value)} />
                  </div>
                  {errors.date && <p className="field-error">{errors.date}</p>}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="fin-note">หมายเหตุ (ไม่บังคับ)</label>
                  <textarea id="fin-note" className="input textarea"
                    placeholder="เพิ่มเติม เช่น รายละเอียด, ชื่อร้าน..."
                    value={form.note} rows={2}
                    onChange={e => field('note', e.target.value)} />
                </div>

                <button type="submit" disabled={saving}
                  className={"btn btn-primary btn-size-lg fin-submit " + (form.type === 'expense' ? 'btn-expense' : 'btn-income')}>
                  {saving ? '⏳ กำลังบันทึก...' : form.type === 'income' ? '+ บันทึกรายรับ' : '+ บันทึกรายจ่าย'}
                </button>
              </form>
            </div>
          ) : (
            <SplitBillForm onSaved={reloadSplit} showFlash={showFlash} />
          )}
        </aside>

        {/* RIGHT PANEL */}
        <section className="fin-right-panel">
          {pageMode === 'finance' ? (
            <>
              <div className="fin-month-bar">
                <span className="fin-month-label">📅 เดือน</span>
                <select className="input fin-month-select"
                  value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  {monthOptions.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="fin-summary-grid">
                <SummaryCard label="รายรับ" value={formatMoney(summary.income)} accent="green"
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
                <SummaryCard label="รายจ่าย" value={formatMoney(summary.expense)} accent="rose"
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>} />
                <SummaryCard
                  label={summary.balance >= 0 ? 'คงเหลือ ✓' : 'คงเหลือ ⚠'}
                  value={formatMoney(summary.balance)}
                  accent={summary.balance >= 0 ? 'violet' : 'amber'}
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>} />
              </div>

              <div className="card card-pad-lg fin-list-card">
                <div className="fin-list-header">
                  <p className="section-label">รายการทั้งหมด</p>
                  <span className="badge">{filtered.length} รายการ</span>
                </div>
                {filtered.length === 0 ? (
                  <div className="fin-empty">
                    <span className="fin-empty-icon">💸</span>
                    <p>ยังไม่มีรายการในเดือนนี้</p>
                    <span>เพิ่มรายรับหรือรายจ่ายด้านซ้าย</span>
                  </div>
                ) : (
                  <div className="fin-tx-list">
                    {filtered.map(entry => (
                      <TxRow key={entry.id} entry={entry} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="fin-summary-grid sb-stats-grid">
                <SummaryCard label="บิลทั้งหมด" value={splitBills.length + " บิล"} accent="violet"
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="17" x2="13" y2="17"/></svg>} />
                <SummaryCard label="ชำระแล้ว" value={splitBills.filter(b => b.isSettled).length + " บิล"} accent="green"
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>} />
                <SummaryCard label="รอชำระ" value={splitBills.filter(b => !b.isSettled).length + " บิล"} accent="amber"
                  icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
              </div>

              <div className="card card-pad-lg sbs-summary-card">
                <SplitBillSummary bills={splitBills} onSettleChange={reloadSplit} />
              </div>

              <div className="card card-pad-lg fin-list-card">
                <div className="fin-list-header">
                  <p className="section-label">ประวัติการหารบิล</p>
                  <span className="badge">{splitBills.length} บิล</span>
                </div>
                <SplitBillHistory
                  bills={splitBills}
                  onReload={reloadSplit}
                  showFlash={showFlash}
                  onAddToFinance={() => { reload() }}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
