import React, { useState, useMemo, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { financeService } from '../../services/financeService.js'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants/categories.js'
import { formatMoney } from '../../utils/formatMoney.js'
import {
  formatDateTH,
  formatDateTimeTH,
  todayISO,
  getMonthOptions,
  getCategoryMeta,
  getTransactionTypeBadge,
} from './financeUtils.js'
import './FinancePage.css'

const SUGGESTED_ICONS = [
  '🎯', '💻', '🎓', '✈️', '📱', '🚗', '💰', '🎮',
  '🏠', '🛡️', '💍', '🎁', '👶', '🚴', '🏥', '⭐',
]

const QUICK_AMOUNTS = [50, 100, 500, 1000, 5000]

const emptyTransaction = {
  type: 'income',
  name: '',
  amount: '',
  category: '',
  date: todayISO(),
  note: '',
}

const emptyGoal = {
  name: '',
  targetAmount: '',
  initialAmount: '',
  icon: '🎯',
  targetDate: '',
  note: '',
}

function parseNumber(value) {
  const n = parseFloat(String(value).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

function isPositiveAmount(value) {
  const n = parseNumber(value)
  return Number.isFinite(n) && n > 0
}

/* ── Generic Modal Dialog ── */
function ModalDialog({ title, subtitle, children, onClose, maxWidth = '540px' }) {
  return (
    <div className="fin-modal-backdrop" onMouseDown={onClose}>
      <section
        className="fin-modal-card card"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={e => e.stopPropagation()}
      >
        <header className="fin-modal-header">
          <div>
            <h2 className="fin-modal-title">{title}</h2>
            {subtitle && <p className="fin-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="fin-modal-close" onClick={onClose} aria-label="ปิด">
            ✕
          </button>
        </header>
        <div className="fin-modal-body">{children}</div>
      </section>
    </div>
  )
}

/* ── Top Stat Card ── */
function StatCard({ icon, label, value, subtext, accent = 'violet' }) {
  return (
    <div className={`fin-stat-card accent-${accent}`}>
      <div className="fin-stat-icon">{icon}</div>
      <div className="fin-stat-content">
        <span className="fin-stat-label">{label}</span>
        <span className="fin-stat-value">{formatMoney(value)}</span>
        {subtext && <span className="fin-stat-subtext">{subtext}</span>}
      </div>
    </div>
  )
}

/* ── Action Picker Modal ── */
function ActionPickerModal({ onSelect, onClose }) {
  return (
    <ModalDialog
      title="บันทึกรายการทางการเงิน"
      subtitle="เลือกประเภทรายการที่คุณต้องการทำ"
      onClose={onClose}
    >
      <div className="fin-action-grid">
        <button
          type="button"
          className="fin-action-choice fin-action-choice--income"
          onClick={() => onSelect('income')}
        >
          <span className="fin-action-icon">🟢</span>
          <div className="fin-action-text">
            <strong>เพิ่มรายรับ</strong>
            <span>เงินเดือน, รายได้พิเศษ, ผู้ปกครองให้</span>
          </div>
        </button>

        <button
          type="button"
          className="fin-action-choice fin-action-choice--expense"
          onClick={() => onSelect('expense')}
        >
          <span className="fin-action-icon">🔴</span>
          <div className="fin-action-text">
            <strong>เพิ่มรายจ่าย</strong>
            <span>ค่าอาหาร, เดินทาง, ซื้อของ, บิลต่างๆ</span>
          </div>
        </button>

        <button
          type="button"
          className="fin-action-choice fin-action-choice--allocate"
          onClick={() => onSelect('allocate')}
        >
          <span className="fin-action-icon">🎯</span>
          <div className="fin-action-text">
            <strong>แบ่งเงินเก็บออม</strong>
            <span>ย้ายเงินจาก "เงินที่ใช้ได้" เข้าเป้าหมายการออม</span>
          </div>
        </button>

        <button
          type="button"
          className="fin-action-choice fin-action-choice--withdraw"
          onClick={() => onSelect('withdraw')}
        >
          <span className="fin-action-icon">↔️</span>
          <div className="fin-action-text">
            <strong>โยกเงินจากเงินออม</strong>
            <span>นำเงินที่ออมไว้กลับมาเป็น "เงินที่ใช้ได้"</span>
          </div>
        </button>
      </div>
    </ModalDialog>
  )
}

/* ── Income & Expense Form Modal ── */
function IncomeExpenseFormModal({ type, onSave, onClose }) {
  const [form, setForm] = useState({ ...emptyTransaction, type })
  const [error, setError] = useState('')
  const isIncome = type === 'income'
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  function handleQuickAmount(amt) {
    const current = parseNumber(form.amount)
    setField('amount', String(current + amt))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('กรุณาระบุชื่อหรือรายละเอียดรายการ')
    if (!isPositiveAmount(form.amount)) return setError('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)')
    if (!form.category) return setError('กรุณาเลือกหมวดหมู่')
    if (!form.date) return setError('กรุณาระบุวันที่')

    onSave({
      type,
      name: form.name.trim(),
      amount: parseNumber(form.amount),
      category: form.category,
      date: new Date(form.date).toISOString(),
      note: form.note.trim(),
    })
  }

  return (
    <ModalDialog
      title={isIncome ? '🟢 เพิ่มรายรับ' : '🔴 เพิ่มรายจ่าย'}
      subtitle={isIncome ? 'บันทึกเงินที่ได้รับเข้าสู่กระเป๋า' : 'บันทึกเงินที่จ่ายจริงออกจากระบบ'}
      onClose={onClose}
    >
      <form className="fin-modal-form" onSubmit={handleSubmit}>
        <div className="fin-field">
          <label className="fin-label">
            รายละเอียดรายการ <span className="field-required">*</span>
          </label>
          <input
            className="input"
            placeholder={isIncome ? 'เช่น เงินเดือน, เงินพิเศษ' : 'เช่น ข้าวมันไก่, ค่าเดินทาง'}
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className="fin-field">
          <label className="fin-label">
            จำนวนเงิน (บาท) <span className="field-required">*</span>
          </label>
          <div className="fin-input-wrapper">
            <span className="fin-input-prefix">฿</span>
            <input
              className="input fin-amount-field"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setField('amount', e.target.value)}
            />
          </div>
          <div className="fin-quick-row">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                className="fin-quick-pill"
                onClick={() => handleQuickAmount(amt)}
              >
                +{amt.toLocaleString('th-TH')}
              </button>
            ))}
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">
            หมวดหมู่ <span className="field-required">*</span>
          </label>
          <div className="fin-cat-picker-grid">
            {categories.map(cat => {
              const isSelected = form.category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`fin-cat-chip ${isSelected ? 'fin-cat-chip--selected' : ''} ${
                    isSelected ? (isIncome ? 'cat-chip-income' : 'cat-chip-expense') : ''
                  }`}
                  onClick={() => setField('category', cat.id)}
                >
                  <span className="fin-cat-emoji">{cat.emoji}</span>
                  <span className="fin-cat-name">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="fin-field-row">
          <div className="fin-field">
            <label className="fin-label">
              วันที่ <span className="field-required">*</span>
            </label>
            <input
              className="input"
              type="date"
              max={todayISO()}
              value={form.date}
              onChange={e => setField('date', e.target.value)}
            />
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            className="input textarea"
            rows="2"
            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            value={form.note}
            onChange={e => setField('note', e.target.value)}
          />
        </div>

        {error && <div className="fin-form-error">{error}</div>}

        <div className="fin-form-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="submit"
            className={`btn btn-primary fin-submit-btn ${
              isIncome ? 'btn-income' : 'btn-expense'
            }`}
          >
            {isIncome ? 'บันทึกรายรับ' : 'บันทึกรายจ่าย'}
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}

/* ── Allocate to Savings Modal ── */
function AllocateSavingsModal({ goals, availableBalance, initialGoalId, onSave, onClose, onCreateGoal }) {
  const [goalId, setGoalId] = useState(initialGoalId || goals[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  const selectedGoal = goals.find(g => g.id === goalId)
  const maxAvailable = Math.max(0, availableBalance)

  function handleQuickSet(val) {
    setAmount(String(val))
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!goalId || !selectedGoal) return setError('กรุณาเลือกเป้าหมายการออม')
    if (!isPositiveAmount(amount)) return setError('กรุณาระบุจำนวนเงินที่ต้องการแบ่งออม')
    const val = parseNumber(amount)
    if (val > maxAvailable) {
      return setError(`จำนวนเงินไม่เพียงพอ คุณสามารถแบ่งได้สูงสุด ${formatMoney(maxAvailable)}`)
    }

    onSave(goalId, val, note.trim(), new Date(date).toISOString())
  }

  if (!goals.length) {
    return (
      <ModalDialog
        title="🎯 แบ่งเงินเก็บออม"
        subtitle="จัดสรรเงินจากเงินที่ใช้ได้ เข้าสู่เป้าหมายการออม"
        onClose={onClose}
      >
        <div className="fin-empty-modal">
          <span className="fin-empty-modal-icon">🎯</span>
          <h3>ยังไม่มีเป้าหมายการออม</h3>
          <p>สร้างเป้าหมายการออมก่อน เพื่อเริ่มแบ่งเงินเก็บ</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose()
              onCreateGoal()
            }}
          >
            + สร้างเป้าหมายการออม
          </button>
        </div>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog
      title="🎯 แบ่งเงินเก็บออม"
      subtitle="ย้ายเงินจาก 'เงินที่ใช้ได้' ไปเก็บไว้ในเป้าหมาย (ไม่ถือเป็นรายจ่าย)"
      onClose={onClose}
    >
      <form className="fin-modal-form" onSubmit={handleSubmit}>
        <div className="fin-balance-banner fin-balance-banner--available">
          <div className="fin-balance-banner-item">
            <span className="banner-label">💳 เงินที่ใช้ได้ขณะนี้</span>
            <strong className="banner-value">{formatMoney(maxAvailable)}</strong>
          </div>
          {selectedGoal && (
            <div className="fin-balance-banner-item text-right">
              <span className="banner-label">ยอดเก็บปัจจุบัน ({selectedGoal.name})</span>
              <strong className="banner-value">{formatMoney(selectedGoal.savedAmount || 0)}</strong>
            </div>
          )}
        </div>

        <div className="fin-field">
          <label className="fin-label">
            เลือกเป้าหมายการออม <span className="field-required">*</span>
          </label>
          <select
            className="input"
            value={goalId}
            onChange={e => {
              setGoalId(e.target.value)
              if (error) setError('')
            }}
          >
            {goals.map(g => (
              <option key={g.id} value={g.id}>
                {g.icon || '🎯'} {g.name} (เก็บแล้ว {formatMoney(g.savedAmount || 0)} / {formatMoney(g.targetAmount || 0)})
              </option>
            ))}
          </select>
        </div>

        <div className="fin-field">
          <label className="fin-label">
            จำนวนเงินที่ต้องการแบ่งไปออม <span className="field-required">*</span>
          </label>
          <div className="fin-input-wrapper">
            <span className="fin-input-prefix">฿</span>
            <input
              className="input fin-amount-field"
              type="number"
              min="0"
              max={maxAvailable}
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={e => {
                setAmount(e.target.value)
                if (error) setError('')
              }}
              autoFocus
            />
          </div>
          <div className="fin-quick-row">
            <button type="button" className="fin-quick-pill" onClick={() => handleQuickSet(500)}>
              ฿500
            </button>
            <button type="button" className="fin-quick-pill" onClick={() => handleQuickSet(1000)}>
              ฿1,000
            </button>
            <button type="button" className="fin-quick-pill" onClick={() => handleQuickSet(2000)}>
              ฿2,000
            </button>
            {maxAvailable > 0 && (
              <button
                type="button"
                className="fin-quick-pill fin-quick-pill--max"
                onClick={() => handleQuickSet(maxAvailable)}
              >
                ทั้งหมด (100%)
              </button>
            )}
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">วันที่</label>
          <input
            className="input"
            type="date"
            max={todayISO()}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="fin-field">
          <label className="fin-label">หมายเหตุ (ไม่บังคับ)</label>
          <input
            className="input"
            placeholder="เช่น แบ่งจากเงินเดือนก้อนแรก"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {error && <div className="fin-form-error">{error}</div>}

        <div className="fin-form-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary fin-submit-btn">
            ยืนยันแบ่งเงินออม
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}

/* ── Withdraw from Savings Modal ── */
function WithdrawSavingsModal({ goals, initialGoalId, onSave, onClose }) {
  const [goalId, setGoalId] = useState(initialGoalId || goals[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  const selectedGoal = goals.find(g => g.id === goalId)
  const maxInGoal = Math.max(0, Number(selectedGoal?.savedAmount || 0))

  function handleQuickSet(val) {
    setAmount(String(val))
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!goalId || !selectedGoal) return setError('กรุณาเลือกเป้าหมายการออม')
    if (!isPositiveAmount(amount)) return setError('กรุณาระบุจำนวนเงินที่ต้องการโยกกลับ')
    const val = parseNumber(amount)
    if (val > maxInGoal) {
      return setError(`ยอดเงินในเป้าหมายไม่เพียงพอ คุณสามารถโยกเงินได้สูงสุด ${formatMoney(maxInGoal)}`)
    }

    onSave(goalId, val, note.trim(), new Date(date).toISOString())
  }

  if (!goals.length) {
    return (
      <ModalDialog
        title="↔️ โยกเงินจากเงินออม"
        subtitle="นำเงินที่ออมไว้กลับมาเป็นเงินที่ใช้ได้"
        onClose={onClose}
      >
        <div className="fin-empty-modal">
          <span className="fin-empty-modal-icon">🎯</span>
          <h3>ยังไม่มีเป้าหมายการออม</h3>
          <p>ไม่มีเงินออมในระบบที่จะโยกกลับ</p>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ปิด
          </button>
        </div>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog
      title="↔️ โยกเงินจากเงินออม"
      subtitle="นำเงินที่ออมไว้กลับมาเป็น 'เงินที่ใช้ได้' (ไม่ถือเป็นรายรับใหม่)"
      onClose={onClose}
    >
      <form className="fin-modal-form" onSubmit={handleSubmit}>
        <div className="fin-balance-banner fin-balance-banner--savings">
          <div className="fin-balance-banner-item">
            <span className="banner-label">🎯 เงินออมในเป้าหมาย ({selectedGoal?.name})</span>
            <strong className="banner-value">{formatMoney(maxInGoal)}</strong>
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">
            เลือกเป้าหมายการออม <span className="field-required">*</span>
          </label>
          <select
            className="input"
            value={goalId}
            onChange={e => {
              setGoalId(e.target.value)
              if (error) setError('')
            }}
          >
            {goals.map(g => (
              <option key={g.id} value={g.id}>
                {g.icon || '🎯'} {g.name} (มีเงินออม {formatMoney(g.savedAmount || 0)})
              </option>
            ))}
          </select>
        </div>

        <div className="fin-field">
          <label className="fin-label">
            จำนวนเงินที่ต้องการโยกกลับมาใช้ <span className="field-required">*</span>
          </label>
          <div className="fin-input-wrapper">
            <span className="fin-input-prefix">฿</span>
            <input
              className="input fin-amount-field"
              type="number"
              min="0"
              max={maxInGoal}
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={e => {
                setAmount(e.target.value)
                if (error) setError('')
              }}
              autoFocus
            />
          </div>
          <div className="fin-quick-row">
            <button type="button" className="fin-quick-pill" onClick={() => handleQuickSet(500)}>
              ฿500
            </button>
            <button type="button" className="fin-quick-pill" onClick={() => handleQuickSet(1000)}>
              ฿1,000
            </button>
            {maxInGoal > 0 && (
              <button
                type="button"
                className="fin-quick-pill fin-quick-pill--max"
                onClick={() => handleQuickSet(maxInGoal)}
              >
                ทั้งหมด (100%)
              </button>
            )}
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">วันที่</label>
          <input
            className="input"
            type="date"
            max={todayISO()}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="fin-field">
          <label className="fin-label">หมายเหตุ (ไม่บังคับ)</label>
          <input
            className="input"
            placeholder="เช่น จำเป็นต้องนำมาจ่ายค่าซ่อมด่วน"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {error && <div className="fin-form-error">{error}</div>}

        <div className="fin-form-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary fin-submit-btn">
            ยืนยันโยกเงินกลับ
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}

/* ── Create / Edit Savings Goal Modal ── */
function GoalFormModal({ goal, availableBalance, onSave, onClose }) {
  const isEditing = Boolean(goal?.id)
  const [form, setForm] = useState(() => {
    if (goal) {
      return {
        name: goal.name || '',
        targetAmount: String(goal.targetAmount || ''),
        initialAmount: '',
        icon: goal.icon || '🎯',
        targetDate: goal.targetDate || '',
        note: goal.note || '',
      }
    }
    return emptyGoal
  })
  const [error, setError] = useState('')

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('กรุณาระบุชื่อเป้าหมายการออม')
    if (!isPositiveAmount(form.targetAmount)) return setError('กรุณาระบุยอดเป้าหมายที่ถูกต้อง')

    const targetVal = parseNumber(form.targetAmount)
    const initialVal = form.initialAmount ? parseNumber(form.initialAmount) : 0

    if (!isEditing && initialVal > 0) {
      if (initialVal > availableBalance) {
        return setError(`ยอดเริ่มต้นสูงสุดไม่เกินเงินที่ใช้ได้ (${formatMoney(availableBalance)})`)
      }
    }

    onSave({
      name: form.name.trim(),
      targetAmount: targetVal,
      initialAmount: isEditing ? undefined : initialVal,
      icon: form.icon || '🎯',
      targetDate: form.targetDate || '',
      note: form.note.trim(),
    })
  }

  return (
    <ModalDialog
      title={isEditing ? '✏️ แก้ไขเป้าหมายการออม' : '+ สร้างเป้าหมายการออม'}
      subtitle={isEditing ? 'แก้ไขข้อมูลเป้าหมายของคุณ' : 'ตั้งเป้าหมายและเริ่มจัดสรรเงินเพื่อสิ่งที่คุณต้องการ'}
      onClose={onClose}
    >
      <form className="fin-modal-form" onSubmit={handleSubmit}>
        <div className="fin-field">
          <label className="fin-label">
            ชื่อเป้าหมาย <span className="field-required">*</span>
          </label>
          <input
            className="input"
            placeholder="เช่น ซื้อคอมใหม่, ค่าเทอม, เที่ยวญี่ปุ่น, เงินสำรอง"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className="fin-field-row">
          <div className="fin-field">
            <label className="fin-label">
              ยอดเป้าหมาย (บาท) <span className="field-required">*</span>
            </label>
            <div className="fin-input-wrapper">
              <span className="fin-input-prefix">฿</span>
              <input
                className="input fin-amount-field"
                type="number"
                min="0"
                step="any"
                placeholder="40,000"
                value={form.targetAmount}
                onChange={e => setField('targetAmount', e.target.value)}
              />
            </div>
          </div>

          {!isEditing && (
            <div className="fin-field">
              <label className="fin-label">ยอดเริ่มต้น (แบ่งทันที - ไม่บังคับ)</label>
              <div className="fin-input-wrapper">
                <span className="fin-input-prefix">฿</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max={Math.max(0, availableBalance)}
                  step="any"
                  placeholder="0"
                  value={form.initialAmount}
                  onChange={e => setField('initialAmount', e.target.value)}
                />
              </div>
              <span className="fin-field-hint">
                เงินที่ใช้ได้: {formatMoney(availableBalance)}
              </span>
            </div>
          )}
        </div>

        <div className="fin-field">
          <label className="fin-label">เลือกไอคอน / Emoji</label>
          <div className="fin-icon-picker">
            {SUGGESTED_ICONS.map(ico => (
              <button
                key={ico}
                type="button"
                className={`fin-icon-chip ${form.icon === ico ? 'fin-icon-chip--active' : ''}`}
                onClick={() => setField('icon', ico)}
              >
                {ico}
              </button>
            ))}
          </div>
        </div>

        <div className="fin-field">
          <label className="fin-label">วันที่ต้องการบรรลุเป้าหมาย (ไม่บังคับ)</label>
          <input
            className="input"
            type="date"
            min={todayISO()}
            value={form.targetDate}
            onChange={e => setField('targetDate', e.target.value)}
          />
        </div>

        <div className="fin-field">
          <label className="fin-label">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
          <textarea
            className="input textarea"
            rows="2"
            placeholder="รายละเอียดหรือเหตุผลในการออม"
            value={form.note}
            onChange={e => setField('note', e.target.value)}
          />
        </div>

        {error && <div className="fin-form-error">{error}</div>}

        <div className="fin-form-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary fin-submit-btn">
            {isEditing ? 'บันทึกการแก้ไข' : 'สร้างเป้าหมาย'}
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}

/* ── Goal History Modal ── */
function GoalHistoryModal({ goal, onClose }) {
  const history = useMemo(() => {
    if (!goal?.id) return []
    return financeService.getGoalHistory(goal.id)
  }, [goal])

  return (
    <ModalDialog
      title={`ประวัติการเคลื่อนไหว: ${goal.icon || '🎯'} ${goal.name}`}
      subtitle={`ยอดเงินออมปัจจุบัน: ${formatMoney(goal.savedAmount || 0)} / ${formatMoney(goal.targetAmount || 0)}`}
      onClose={onClose}
      maxWidth="600px"
    >
      <div className="fin-goal-history-list">
        {history.length ? (
          history.map(item => {
            const isDeposit = item.type === 'SAVING_TRANSFER_IN'
            return (
              <div key={item.id} className="fin-goal-history-item">
                <div className={`fin-gh-icon ${isDeposit ? 'gh-in' : 'gh-out'}`}>
                  {isDeposit ? '↗' : '↙'}
                </div>
                <div className="fin-gh-info">
                  <strong>{isDeposit ? 'แบ่งเงินเข้าเป้าหมาย' : 'โยกเงินออกไปใช้'}</strong>
                  <span>{formatDateTimeTH(item.date)}</span>
                  {item.note && <p className="fin-gh-note">{item.note}</p>}
                </div>
                <div className={`fin-gh-amount ${isDeposit ? 'tx-saving-in' : 'tx-saving-out'}`}>
                  {isDeposit ? '+' : '-'}{formatMoney(item.amount)}
                </div>
              </div>
            )
          })
        ) : (
          <div className="fin-empty-modal">
            <span className="fin-empty-modal-icon">📋</span>
            <p>ยังไม่มีประวัติการแบ่งเงินหรือโยกเงินสำหรับเป้าหมายนี้</p>
          </div>
        )}
      </div>
    </ModalDialog>
  )
}

/* ── Transaction Row Component ── */
function TransactionRow({ entry, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isIncome = entry.type === 'income'
  const isExpense = entry.type === 'expense'
  const isSavingIn = entry.type === 'SAVING_TRANSFER_IN'
  const isSavingOut = entry.type === 'SAVING_TRANSFER_OUT'

  const meta = getCategoryMeta(entry.category, entry.type)
  const badge = getTransactionTypeBadge(entry.type)

  let iconChar = meta?.emoji || '💸'
  let amountClass = 'tx-expense'
  let prefix = '-'

  if (isIncome) {
    amountClass = 'tx-income'
    prefix = '+'
  } else if (isSavingIn) {
    iconChar = '↗'
    amountClass = 'tx-saving-in'
    prefix = '↗ '
  } else if (isSavingOut) {
    iconChar = '↙'
    amountClass = 'tx-saving-out'
    prefix = '↙ '
  }

  return (
    <div className={`tx-row tx-row--${entry.type}`}>
      <div className={`tx-cat-icon icon-type-${badge.color}`}>
        {iconChar}
      </div>

      <div className="tx-info">
        <div className="tx-top-row">
          <span className="tx-name" title={entry.name}>{entry.name}</span>
          <span className={`tx-type-badge badge-${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <div className="tx-meta-row">
          {meta?.label && !isSavingIn && !isSavingOut && (
            <span className="tx-cat-badge">{meta.emoji} {meta.label}</span>
          )}
          <span className="tx-date">{formatDateTH(entry.date)}</span>
          {entry.note && <span className="tx-note" title={entry.note}>• {entry.note}</span>}
        </div>
      </div>

      <div className="tx-right">
        <span className={`tx-amount ${amountClass}`}>
          {prefix}{formatMoney(entry.amount)}
        </span>

        {showConfirm ? (
          <div className="tx-confirm-box">
            <span>ลบ?</span>
            <button
              className="tx-confirm-btn"
              onClick={() => onDelete(entry.id)}
              aria-label="ยืนยันลบ"
            >
              ✓
            </button>
            <button
              className="tx-cancel-btn"
              onClick={() => setShowConfirm(false)}
              aria-label="ยกเลิก"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="tx-delete"
            onClick={() => setShowConfirm(true)}
            aria-label="ลบรายการ"
            title="ลบรายการ"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN FINANCE PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function FinancePage() {
  const [tab, setTab] = useState('transactions')
  const [modal, setModal] = useState(null)
  const [activeGoal, setActiveGoal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [flash, setFlash] = useState('')

  const [entries, setEntries] = useState(() => financeService.getAll())
  const [goals, setGoals] = useState(() => financeService.getSavingGoals())

  const refreshData = useCallback(() => {
    setEntries(financeService.getAll())
    setGoals(financeService.getSavingGoals())
  }, [])

  const balances = useMemo(() => financeService.getBalances(), [entries, goals])

  const notify = (text) => {
    setFlash(text)
    setTimeout(() => setFlash(''), 3000)
  }

  const closeModal = () => {
    setModal(null)
    setActiveGoal(null)
  }

  /* ── Filtered Transactions ── */
  const filteredHistory = useMemo(() => {
    return entries.filter(item => {
      // Month filter
      if (selectedMonth && item.date.slice(0, 7) !== selectedMonth) {
        return false
      }
      // Type filter
      if (typeFilter === 'income' && item.type !== 'income') return false
      if (typeFilter === 'expense' && item.type !== 'expense') return false
      if (typeFilter === 'saving' && !item.type?.startsWith('SAVING_TRANSFER')) return false

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.name?.toLowerCase().includes(q)
        const matchNote = item.note?.toLowerCase().includes(q)
        const matchCat = item.category?.toLowerCase().includes(q)
        if (!matchName && !matchNote && !matchCat) return false
      }

      return true
    })
  }, [entries, selectedMonth, typeFilter, searchQuery])

  /* ── Chart data for Overview ── */
  const chartData = useMemo(() => {
    return financeService.getMonthlyChart(6)
  }, [entries])

  const categoryExpenses = useMemo(() => {
    return financeService.getCategoryBreakdown('expense')
  }, [entries])

  /* ── Handlers ── */
  const handleSaveTransaction = (entryData) => {
    financeService.add(entryData)
    refreshData()
    closeModal()
    notify(entryData.type === 'income' ? 'บันทึกรายรับแล้ว' : 'บันทึกรายจ่ายแล้ว')
  }

  const handleAllocateSaving = (goalId, amount, note, date) => {
    const res = financeService.allocateToSaving(goalId, amount, note, date)
    if (!res.ok) {
      return notify(res.error || 'ไม่สามารถแบ่งเงินออมได้')
    }
    refreshData()
    closeModal()
    notify('แบ่งเงินเก็บออมสำเร็จ 🎉')
  }

  const handleWithdrawSaving = (goalId, amount, note, date) => {
    const res = financeService.withdrawFromSaving(goalId, amount, note, date)
    if (!res.ok) {
      return notify(res.error || 'ไม่สามารถโยกเงินกลับได้')
    }
    refreshData()
    closeModal()
    notify('โยกเงินกลับมาใช้สำเร็จ 💳')
  }

  const handleSaveGoal = (goalData) => {
    if (activeGoal?.id) {
      financeService.updateSavingGoal(activeGoal.id, goalData)
      notify('แก้ไขเป้าหมายการออมแล้ว')
    } else {
      financeService.addSavingGoal(goalData)
      notify('สร้างเป้าหมายการออมสำเร็จ 🎯')
    }
    refreshData()
    closeModal()
  }

  const handleDeleteGoal = (goal) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมาย "${goal.name}"?\n(หากมียอดเงินออมคงเหลือ ระบบจะคืนเงินเข้า "เงินที่ใช้ได้" อัตโนมัติ)`)) {
      financeService.deleteSavingGoal(goal.id, true)
      refreshData()
      notify(`ลบเป้าหมาย "${goal.name}" แล้ว`)
    }
  }

  const handleDeleteTransaction = (id) => {
    financeService.delete(id)
    refreshData()
    notify('ลบรายการเรียบร้อยแล้ว')
  }

  const monthOptions = useMemo(() => getMonthOptions(12), [])

  return (
    <div className="fin-page">
      {/* Toast Notification */}
      {flash && <div className="fin-toast fin-toast--ok animate-fadeup">{flash}</div>}

      {/* Page Header */}
      <div className="fin-page-head">
        <div>
          <h1 className="page-title">การเงิน (Finance)</h1>
          <p className="fin-page-desc">
            ระบบบริหารรายรับ-รายจ่าย และจัดสรรเงินออมส่วนบุคคล
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary fin-btn-add"
          onClick={() => setModal('action')}
        >
          + บันทึกรายการ
        </button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="fin-mode-tabs">
        <button
          type="button"
          className={`fin-mode-tab ${tab === 'transactions' ? 'fin-mode-tab--active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          💰 รายรับ / รายจ่าย
        </button>
        <button
          type="button"
          className={`fin-mode-tab ${tab === 'savings' ? 'fin-mode-tab--active' : ''}`}
          onClick={() => setTab('savings')}
        >
          🎯 เป้าหมายการออม {goals.length > 0 && `(${goals.length})`}
        </button>
        <button
          type="button"
          className={`fin-mode-tab ${tab === 'overview' ? 'fin-mode-tab--active' : ''}`}
          onClick={() => setTab('overview')}
        >
          📊 ภาพรวม
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="fin-summary-grid">
        <StatCard
          icon="💰"
          label="เงินทั้งหมด"
          value={balances.total}
          subtext="ใช้ได้ + เงินออม"
          accent="violet"
        />
        <StatCard
          icon="💳"
          label="เงินที่ใช้ได้"
          value={balances.available}
          subtext={balances.available >= 0 ? 'พร้อมใช้จ่าย' : '⚠ ติดลบ'}
          accent={balances.available >= 0 ? 'green' : 'rose'}
        />
        <StatCard
          icon="🎯"
          label="เงินออมทั้งหมด"
          value={balances.savings}
          subtext={`${goals.length} เป้าหมาย`}
          accent="amber"
        />
        <StatCard
          icon="📈"
          label="รายรับเดือนนี้"
          value={balances.thisMonthIncome}
          subtext="Income"
          accent="green"
        />
        <StatCard
          icon="📉"
          label="รายจ่ายเดือนนี้"
          value={balances.thisMonthExpense}
          subtext="Expense"
          accent="rose"
        />
      </div>

      {/* ── TAB 1: Transactions (รายรับ / รายจ่าย) ── */}
      {tab === 'transactions' && (
        <section className="fin-card card fin-list-container">
          <header className="fin-panel-header">
            <div className="fin-panel-title-row">
              <span className="section-label">ประวัติรายการทั้งหมด</span>
              <span className="badge badge-violet">{filteredHistory.length} รายการ</span>
            </div>

            {/* Filter & Search Bar */}
            <div className="fin-filter-bar">
              <div className="fin-search-box">
                <span className="fin-search-icon">🔍</span>
                <input
                  type="text"
                  className="input fin-search-input"
                  placeholder="ค้นหารายการ, หมายเหตุ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="fin-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="ล้างคำค้นหา"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="fin-filter-chips">
                <button
                  type="button"
                  className={`fin-chip ${typeFilter === 'all' ? 'fin-chip--active' : ''}`}
                  onClick={() => setTypeFilter('all')}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  className={`fin-chip chip-income ${typeFilter === 'income' ? 'fin-chip--active' : ''}`}
                  onClick={() => setTypeFilter('income')}
                >
                  🟢 รายรับ
                </button>
                <button
                  type="button"
                  className={`fin-chip chip-expense ${typeFilter === 'expense' ? 'fin-chip--active' : ''}`}
                  onClick={() => setTypeFilter('expense')}
                >
                  🔴 รายจ่าย
                </button>
                <button
                  type="button"
                  className={`fin-chip chip-saving ${typeFilter === 'saving' ? 'fin-chip--active' : ''}`}
                  onClick={() => setTypeFilter('saving')}
                >
                  🎯 การออม
                </button>
              </div>

              <div className="fin-month-filter">
                <select
                  className="input fin-month-select"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  <option value="">ทุกเดือน</option>
                  {monthOptions.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {/* Scrollable List bounded cleanly */}
          <div className="fin-scroll-list">
            {filteredHistory.length > 0 ? (
              <div className="fin-tx-list">
                {filteredHistory.map(item => (
                  <TransactionRow
                    key={item.id}
                    entry={item}
                    onDelete={handleDeleteTransaction}
                  />
                ))}
              </div>
            ) : (
              <div className="fin-empty">
                <span className="fin-empty-icon">💸</span>
                <p>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                <span>กดปุ่ม "+ บันทึกรายการ" เพื่อเริ่มต้น</span>
                <button
                  type="button"
                  className="btn btn-primary btn-size-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => setModal('action')}
                >
                  + บันทึกรายการ
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TAB 2: Savings Goals (เป้าหมายการออม) ── */}
      {tab === 'savings' && (
        <section className="fin-savings-view">
          <div className="fin-savings-top-bar">
            <div>
              <h2 className="fin-section-title">🎯 เป้าหมายการออม</h2>
              <p className="fin-section-desc">
                การออมคือการจัดสรรเงิน ไม่ใช่รายจ่าย (เงินยังเป็นของคุณเสมอ)
              </p>
            </div>
            <div className="fin-savings-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!goals.length}
                onClick={() => setModal('withdraw')}
              >
                ↔ โยกเงินกลับ
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!goals.length}
                onClick={() => setModal('allocate')}
              >
                🎯 แบ่งเงินออม
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActiveGoal(null)
                  setModal('goal')
                }}
              >
                + สร้างเป้าหมายการออม
              </button>
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="fin-goals-grid">
              {goals.map(goal => {
                const saved = Number(goal.savedAmount || 0)
                const target = Number(goal.targetAmount || 0)
                const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
                const remaining = Math.max(0, target - saved)
                const isCompleted = target > 0 && saved >= target

                return (
                  <article className={`card fin-goal-card ${isCompleted ? 'goal-completed' : ''}`} key={goal.id}>
                    <div className="fin-gc-header">
                      <div className="fin-gc-icon">{goal.icon || '🎯'}</div>
                      <div className="fin-gc-title-wrap">
                        <h3 className="fin-gc-title">{goal.name}</h3>
                        {goal.targetDate && (
                          <span className="fin-gc-date">
                            📅 เป้าหมาย {formatDateTH(goal.targetDate)}
                          </span>
                        )}
                      </div>
                      {isCompleted && (
                        <span className="badge badge-green fin-gc-complete-badge">
                          🎉 สำเร็จแล้ว!
                        </span>
                      )}
                    </div>

                    <div className="fin-gc-amounts">
                      <div className="fin-gc-saved-row">
                        <span className="fin-gc-saved-val">{formatMoney(saved)}</span>
                        <span className="fin-gc-target-val">/ {formatMoney(target)}</span>
                      </div>
                      <div className="fin-gc-remaining-row">
                        <span>
                          {isCompleted
                            ? 'ครบตามเป้าหมายแล้ว!'
                            : `เหลืออีก ${formatMoney(remaining)}`}
                        </span>
                        <strong className="fin-gc-pct">{pct}%</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="fin-progress-track">
                      <div
                        className={`fin-progress-bar ${isCompleted ? 'progress-done' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {goal.note && <p className="fin-gc-note">{goal.note}</p>}

                    {/* Goal Card Actions */}
                    <div className="fin-gc-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-size-sm"
                        onClick={() => {
                          setActiveGoal(goal)
                          setModal('allocate')
                        }}
                      >
                        + แบ่งเงินเข้า
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-size-sm"
                        disabled={saved <= 0}
                        onClick={() => {
                          setActiveGoal(goal)
                          setModal('withdraw')
                        }}
                      >
                        ↙ โยกเงินออก
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-size-sm"
                        onClick={() => {
                          setActiveGoal(goal)
                          setModal('history')
                        }}
                        title="ดูประวัติการเคลื่อนไหว"
                      >
                        📋 ประวัติ
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-size-sm"
                        onClick={() => {
                          setActiveGoal(goal)
                          setModal('goal')
                        }}
                        title="แก้ไขเป้าหมาย"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-size-sm fin-btn-del"
                        onClick={() => handleDeleteGoal(goal)}
                        title="ลบเป้าหมาย"
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="card card-pad-lg fin-empty">
              <span className="fin-empty-icon">🎯</span>
              <h3>ยังไม่มีเป้าหมายการออม</h3>
              <p>สร้างเป้าหมายเพื่อแบ่งเงินเก็บสำหรับสิ่งที่คุณต้องการ</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setActiveGoal(null)
                  setModal('goal')
                }}
              >
                + สร้างเป้าหมายการออมแรก
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── TAB 3: Overview (ภาพรวม) ── */}
      {tab === 'overview' && (
        <section className="fin-overview-container">
          <div className="fin-overview-grid-top">
            {/* Money Allocation Balance Card */}
            <div className="card card-pad-lg">
              <h2 className="fin-overview-card-title">💰 สัดส่วนเงินทั้งหมด</h2>
              <div className="fin-balance-split-card">
                <div className="fin-split-total">
                  <span>เงินทั้งหมดที่คุณมี</span>
                  <strong>{formatMoney(balances.total)}</strong>
                </div>

                {/* Proportion bar */}
                {balances.total > 0 ? (
                  <div className="fin-split-bar">
                    <div
                      className="fin-split-avail"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (balances.available / balances.total) * 100)
                        )}%`,
                      }}
                      title={`เงินที่ใช้ได้: ${formatMoney(balances.available)}`}
                    />
                    <div
                      className="fin-split-save"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (balances.savings / balances.total) * 100)
                        )}%`,
                      }}
                      title={`เงินออม: ${formatMoney(balances.savings)}`}
                    />
                  </div>
                ) : null}

                <div className="fin-split-legend">
                  <div className="fin-legend-item">
                    <span className="fin-legend-dot dot-avail" />
                    <div>
                      <small>เงินที่ใช้ได้ (Available)</small>
                      <strong>{formatMoney(balances.available)}</strong>
                    </div>
                  </div>
                  <div className="fin-legend-item">
                    <span className="fin-legend-dot dot-save" />
                    <div>
                      <small>เงินออม (Savings)</small>
                      <strong>{formatMoney(balances.savings)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Logic Explainer Card */}
            <div className="card card-pad-lg fin-explainer-card">
              <h2 className="fin-overview-card-title">📐 หลักการจัดสรรเงิน</h2>
              <ul className="fin-explainer-list">
                <li>
                  <strong>เงินทั้งหมด = เงินที่ใช้ได้ + เงินออม</strong>
                  <p>คือมูลค่าเงินจริงทั้งหมดที่คุณมีในครอบครอง</p>
                </li>
                <li>
                  <strong>การแบ่งเงินไปออม ≠ รายจ่าย</strong>
                  <p>เงินยังคงเป็นของคุณ เพียงแค่ย้ายจาก "เงินที่ใช้ได้" ไปยังเป้าหมาย</p>
                </li>
                <li>
                  <strong>การโยกเงินกลับ ≠ รายรับใหม่</strong>
                  <p>เป็นการนำเงินที่ออมไว้กลับมาใช้ ไม่ทำให้ยอดรายรับจริงผิดเพี้ยน</p>
                </li>
              </ul>
            </div>
          </div>

          {/* 6-Month Income vs Expense Chart */}
          <div className="card card-pad-lg fin-chart-card">
            <h2 className="fin-overview-card-title">📈 รายรับ-รายจ่าย 6 เดือนย้อนหลัง</h2>
            <p className="fin-chart-sub">
              (คำนวณจากรายรับและรายจ่ายจริง โดยไม่รวมยอดการโยกเงินออม)
            </p>
            <div className="fin-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chartExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#8e8ea0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#8e8ea0', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="chart-tooltip">
                          <p className="chart-tooltip-label">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} style={{ color: p.color, margin: '3px 0', fontSize: '0.85rem' }}>
                              {p.name}: {formatMoney(p.value)}
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="รายรับ"
                    stroke="#4ade80"
                    fill="url(#chartIncomeGrad)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="รายจ่าย"
                    stroke="#f43f5e"
                    fill="url(#chartExpenseGrad)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Expense Breakdown */}
          {categoryExpenses.length > 0 && (
            <div className="card card-pad-lg">
              <h2 className="fin-overview-card-title">🛍️ รายจ่ายแยกตามหมวดหมู่</h2>
              <div className="fin-cat-breakdown-list">
                {categoryExpenses.map(item => {
                  const meta = getCategoryMeta(item.category, 'expense')
                  const totalExp = balances.expense || 1
                  const pct = Math.round((item.amount / totalExp) * 100)
                  return (
                    <div key={item.category} className="fin-cat-bd-row">
                      <div className="fin-cat-bd-left">
                        <span className="fin-cat-bd-emoji">{meta.emoji}</span>
                        <span className="fin-cat-bd-name">{meta.label}</span>
                      </div>
                      <div className="fin-cat-bd-mid">
                        <div className="fin-cat-bd-track">
                          <div className="fin-cat-bd-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="fin-cat-bd-right">
                        <strong>{formatMoney(item.amount)}</strong>
                        <small>{pct}%</small>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── MODALS ── */}
      {modal === 'action' && (
        <ActionPickerModal
          onSelect={actionType => setModal(actionType)}
          onClose={closeModal}
        />
      )}

      {modal === 'income' && (
        <IncomeExpenseFormModal
          type="income"
          onSave={handleSaveTransaction}
          onClose={closeModal}
        />
      )}

      {modal === 'expense' && (
        <IncomeExpenseFormModal
          type="expense"
          onSave={handleSaveTransaction}
          onClose={closeModal}
        />
      )}

      {modal === 'allocate' && (
        <AllocateSavingsModal
          goals={goals}
          availableBalance={balances.available}
          initialGoalId={activeGoal?.id}
          onSave={handleAllocateSaving}
          onClose={closeModal}
          onCreateGoal={() => {
            setActiveGoal(null)
            setModal('goal')
          }}
        />
      )}

      {modal === 'withdraw' && (
        <WithdrawSavingsModal
          goals={goals}
          initialGoalId={activeGoal?.id}
          onSave={handleWithdrawSaving}
          onClose={closeModal}
        />
      )}

      {modal === 'goal' && (
        <GoalFormModal
          goal={activeGoal}
          availableBalance={balances.available}
          onSave={handleSaveGoal}
          onClose={closeModal}
        />
      )}

      {modal === 'history' && activeGoal && (
        <GoalHistoryModal
          goal={activeGoal}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

