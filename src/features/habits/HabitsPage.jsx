import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { habitService } from '../../services/habitService.js'
import {
  HABIT_CATEGORIES, HABIT_COLORS, EMOJI_PRESETS,
  getCategoryMeta, getColorHex, dayLabel,
  validateHabit, rateColor,
} from './habitsUtils.js'
import './HabitsPage.css'

/* ══════════════════════════════════════════════════════════
   Toast
══════════════════════════════════════════════════════════ */
function Toast({ flash }) {
  if (!flash) return null
  return <div className={`habit-toast habit-toast--${flash.type}`}>{flash.msg}</div>
}

/* ══════════════════════════════════════════════════════════
   Habit Form Modal (Add / Edit)
══════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  title:    '',
  emoji:    '⭐',
  category: 'general',
  color:    'violet',
  note:     '',
}

function HabitModal({ open, habit, onClose, onSaved }) {
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(habit ? {
      title:    habit.title,
      emoji:    habit.emoji    || '⭐',
      category: habit.category || 'general',
      color:    habit.color    || 'violet',
      note:     habit.note     || '',
    } : EMPTY_FORM)
    setErrors({})
    setTimeout(() => titleRef.current?.focus(), 80)
  }, [open, habit?.id])

  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  function field(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validateHabit(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = {
      title:    form.title.trim(),
      emoji:    form.emoji,
      category: form.category,
      color:    form.color,
      note:     form.note.trim() || null,
    }
    if (habit) habitService.update(habit.id, payload)
    else        habitService.add(payload)
    onSaved()
    onClose()
  }

  const colorHex = getColorHex(form.color)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md habit-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {habit ? '✏️ แก้ไข Habit' : '✨ เพิ่ม Habit ใหม่'}
          </h3>
          <button className="btn btn-icon modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} noValidate className="habit-form">

            {/* Preview */}
            <div className="habit-preview" style={{ borderColor: colorHex + '55', background: colorHex + '11' }}>
              <span className="habit-preview-emoji">{form.emoji}</span>
              <span className="habit-preview-title" style={{ color: colorHex }}>
                {form.title || 'ชื่อ Habit ของคุณ'}
              </span>
            </div>

            {/* Emoji */}
            <div className="field">
              <label className="field-label">Emoji</label>
              <div className="emoji-picker">
                {EMOJI_PRESETS.map(em => (
                  <button key={em} type="button"
                    className={`emoji-btn ${form.emoji === em ? 'emoji-btn--active' : ''}`}
                    onClick={() => field('emoji', em)}>{em}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="field">
              <label className="field-label" htmlFor="h-title">ชื่อ Habit *</label>
              <input ref={titleRef} id="h-title"
                className={`input ${errors.title ? 'input-error' : ''}`}
                type="text" placeholder="เช่น ดื่มน้ำ 8 แก้ว, อ่านหนังสือ 30 นาที"
                value={form.title} maxLength={60}
                onChange={e => field('title', e.target.value)} />
              {errors.title && <p className="field-error">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="field">
              <label className="field-label">หมวดหมู่</label>
              <div className="cat-chip-row">
                {HABIT_CATEGORIES.map(c => (
                  <button key={c.id} type="button"
                    className={`cat-chip-sm ${form.category === c.id ? 'cat-chip-sm--active' : ''}`}
                    onClick={() => field('category', c.id)}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="field">
              <label className="field-label">สี</label>
              <div className="habit-color-row">
                {HABIT_COLORS.map(c => (
                  <button key={c.id} type="button"
                    className={`habit-color-btn ${form.color === c.id ? 'habit-color-btn--active' : ''}`}
                    style={{ '--btn-color': c.hex }}
                    title={c.label}
                    onClick={() => field('color', c.id)}>
                    {form.color === c.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="field">
              <label className="field-label" htmlFor="h-note">หมายเหตุ (ไม่บังคับ)</label>
              <input id="h-note" className="input"
                type="text" placeholder="เช่น ทำหลังตื่นนอน, ก่อนนอน..."
                value={form.note}
                onChange={e => field('note', e.target.value)} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">
                {habit ? '💾 บันทึก' : '+ เพิ่ม Habit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Habit Card
══════════════════════════════════════════════════════════ */
function HabitCard({ habit, onEdit, onDelete, onToggle, checked, recentDays, streak, monthRate }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const catMeta  = getCategoryMeta(habit.category)
  const colorHex = getColorHex(habit.color)

  function handleDelete() {
    if (confirmDel) { onDelete(habit.id); setConfirmDel(false) }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000) }
  }

  return (
    <div className={`habit-card ${checked ? 'habit-card--done' : ''}`}
      style={{ '--habit-color': colorHex }}>

      {/* Check button */}
      <button
        className={`habit-check-btn ${checked ? 'habit-check-btn--done' : ''}`}
        onClick={() => onToggle(habit.id)}
        aria-label={checked ? 'ยกเลิก' : 'เช็ค habit วันนี้'}
        title={checked ? 'กดเพื่อยกเลิก' : 'กดเพื่อเช็ค'}
      >
        {checked ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : (
          <span className="habit-check-empty"/>
        )}
      </button>

      {/* Content */}
      <div className="habit-card-body">
        <div className="habit-card-top">
          <span className="habit-card-emoji">{habit.emoji}</span>
          <div className="habit-card-info">
            <p className="habit-card-title">{habit.title}</p>
            <div className="habit-card-meta">
              <span className="habit-cat-tag">{catMeta.emoji} {catMeta.label}</span>
              {habit.note && <span className="habit-note-tag">· {habit.note}</span>}
            </div>
          </div>
          <div className="habit-card-right">
            {streak > 0 && (
              <div className="habit-streak" title={`${streak} วันติดต่อกัน`}>
                <span className="habit-streak-fire">{streak >= 7 ? '🔥' : '⚡'}</span>
                <span className="habit-streak-count">{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* 7-day dots */}
        <div className="habit-days">
          {recentDays.map(({ date, checked: dayChecked }) => (
            <div key={date} className="habit-day-item" title={date}>
              <div className={`habit-day-dot ${dayChecked ? 'habit-day-dot--filled' : ''}`}/>
              <span className="habit-day-label">{dayLabel(date)}</span>
            </div>
          ))}
        </div>

        {/* Rate bar */}
        <div className="habit-rate-row">
          <div className="habit-rate-track">
            <div className="habit-rate-fill"
              style={{ width: `${monthRate}%`, background: colorHex }}/>
          </div>
          <span className="habit-rate-pct" style={{ color: rateColor(monthRate) }}>
            {monthRate}%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="habit-actions">
        <button className="habit-act-btn" onClick={() => onEdit(habit)} title="แก้ไข">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className={`habit-act-btn habit-act-btn--del ${confirmDel ? 'habit-act-btn--confirm' : ''}`}
          onClick={handleDelete}
          title={confirmDel ? 'ยืนยันการลบ' : 'ลบ'}
        >
          {confirmDel
            ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          }
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════ */
export default function HabitsPage() {
  const [habits,     setHabits]     = useState(() => habitService.getAll())
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editHabit,  setEditHabit]  = useState(null)
  const [flash,      setFlash]      = useState(null)
  const [filterCat,  setFilterCat]  = useState('')
  const [tick,       setTick]       = useState(0) // force re-render เมื่อ toggle

  const reload = useCallback(() => {
    setHabits(habitService.getAll())
    setTick(t => t + 1)
  }, [])

  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 2200)
  }

  function handleToggle(id) {
    habitService.toggle(id)
    setTick(t => t + 1)
    const checked = habitService.isChecked(id)
    showFlash(checked ? '✅ เช็คแล้ว!' : '↩️ ยกเลิกแล้ว', checked ? 'ok' : 'warn')
  }

  function handleEdit(habit)  { setEditHabit(habit); setModalOpen(true) }
  function handleAdd()        { setEditHabit(null);  setModalOpen(true) }
  function handleDelete(id)   {
    habitService.delete(id); reload()
    showFlash('🗑️ ลบ Habit แล้ว', 'warn')
  }
  function handleSaved() {
    reload()
    showFlash(editHabit ? '✅ แก้ไขแล้ว' : '✅ เพิ่ม Habit แล้ว')
  }

  const summary = useMemo(() => habitService.getSummary(), [tick, habits])

  const visible = useMemo(() => {
    if (!filterCat) return habits
    return habits.filter(h => h.category === filterCat)
  }, [habits, filterCat])

  /* sort: ยังไม่เช็คขึ้นก่อน, เช็คแล้วไปล่าง */
  const sorted = useMemo(() => {
    return [...visible].sort((a, b) => {
      const ac = habitService.isChecked(a.id) ? 1 : 0
      const bc = habitService.isChecked(b.id) ? 1 : 0
      return ac - bc
    })
  }, [visible, tick])

  const usedCats = useMemo(() => {
    const ids = new Set(habits.map(h => h.category))
    return HABIT_CATEGORIES.filter(c => ids.has(c.id))
  }, [habits])

  return (
    <div className="habits-page">
      <Toast flash={flash} />

      <HabitModal
        open={modalOpen}
        habit={editHabit}
        onClose={() => { setModalOpen(false); setEditHabit(null) }}
        onSaved={handleSaved}
      />

      {/* ── Summary bar ── */}
      <div className="habits-summary animate-fadeup">
        <div className="habits-sum-item">
          <span className="habits-sum-num">{summary.total}</span>
          <span className="habits-sum-label">Habits ทั้งหมด</span>
        </div>
        <div className="habits-sum-divider"/>
        <div className="habits-sum-item habits-sum-item--done">
          <span className="habits-sum-num">{summary.doneToday}</span>
          <span className="habits-sum-label">เช็คแล้ววันนี้</span>
        </div>
        <div className="habits-sum-divider"/>
        <div className="habits-sum-item habits-sum-item--remain">
          <span className="habits-sum-num">{summary.remaining}</span>
          <span className="habits-sum-label">ยังเหลือ</span>
        </div>

        {/* overall progress */}
        {summary.total > 0 && (
          <div className="habits-sum-progress">
            <div className="habits-sum-track">
              <div className="habits-sum-fill"
                style={{ width: `${Math.round((summary.doneToday / summary.total) * 100)}%` }}/>
            </div>
            <span className="habits-sum-pct">
              {Math.round((summary.doneToday / summary.total) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* ── Header ── */}
      <div className="habits-header">
        <div className="habits-cat-filter">
          <button
            className={`filter-chip ${!filterCat ? 'filter-chip--active' : ''}`}
            onClick={() => setFilterCat('')}>
            ทั้งหมด
            <span className="todo-tab-count">{habits.length}</span>
          </button>
          {usedCats.map(c => (
            <button key={c.id}
              className={`filter-chip ${filterCat === c.id ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterCat(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <button className="btn btn-primary habits-add-btn" onClick={handleAdd}>
          + เพิ่ม Habit
        </button>
      </div>

      {/* ── List ── */}
      {sorted.length === 0 ? (
        <div className="habits-empty animate-fadeup">
          <span className="habits-empty-icon">🌱</span>
          <p>{filterCat ? 'ไม่มี Habit ในหมวดนี้' : 'ยังไม่มี Habit'}</p>
          <span>
            {filterCat
              ? 'ลองเปลี่ยนหมวดหมู่ หรือเพิ่ม Habit ใหม่'
              : 'เริ่มสร้างนิสัยดีๆ ทีละอย่าง ทำทุกวันให้ได้ 🔥'}
          </span>
          {!filterCat && (
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={handleAdd}>
              + เพิ่ม Habit แรก
            </button>
          )}
        </div>
      ) : (
        <div className="habits-list">
          {sorted.map(habit => (
            <HabitCard
              key={habit.id + tick}
              habit={habit}
              checked={habitService.isChecked(habit.id)}
              recentDays={habitService.getRecentDays(habit.id, 7)}
              streak={habitService.getStreak(habit.id)}
              monthRate={habitService.getMonthlyRate(habit.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
