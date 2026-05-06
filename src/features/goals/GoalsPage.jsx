import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { goalsService } from '../../services/goalsService.js'
import {
  GOAL_CATEGORIES, CATEGORY_COLOR, FILL_CLASS,
  getCategoryMeta, calcPct, deadlineLabel,
  validateGoal, formatNum,
} from './goalsUtils.js'
import './GoalsPage.css'

/* ─────────────────────────────────────────────────────────
   Goal Form Modal (Add / Edit)
───────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: '', category: 'other', emoji: '🎯',
  target: '', unit: '', progress: '0', deadline: '', note: '',
}
const EMOJI_PRESETS = ['🎯','💰','🏃','📚','✈️','💪','❤️','🏠','💻','🎨','🎓','🌟','🏆','🎵','🌱']

function GoalModal({ open, goal, onClose, onSaved }) {
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(goal
      ? { title: goal.title, category: goal.category || 'other',
          emoji: goal.emoji || '🎯', target: String(goal.target),
          unit: goal.unit || '', progress: String(goal.progress ?? 0),
          deadline: goal.deadline?.slice(0, 10) || '', note: goal.note || '' }
      : EMPTY_FORM
    )
    setErrors({})
    setTimeout(() => titleRef.current?.focus(), 80)
  }, [open, goal?.id])

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
    const errs = validateGoal(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      title:    form.title.trim(),
      category: form.category,
      emoji:    form.emoji,
      target:   parseFloat(form.target),
      unit:     form.unit.trim(),
      progress: parseFloat(form.progress) || 0,
      deadline: form.deadline || null,
      note:     form.note.trim() || null,
    }
    if (goal) { goalsService.update(goal.id, payload) }
    else       { goalsService.add(payload) }
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <h3 className="modal-title">{goal ? '✏️ แก้ไขเป้าหมาย' : '🎯 เพิ่มเป้าหมายใหม่'}</h3>
          <button className="btn btn-icon modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

            {/* Emoji picker */}
            <div className="field">
              <label className="field-label">Emoji</label>
              <div className="emoji-picker">
                {EMOJI_PRESETS.map(em => (
                  <button key={em} type="button"
                    className={`emoji-btn ${form.emoji === em ? 'emoji-btn--active' : ''}`}
                    onClick={() => field('emoji', em)}>{em}</button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="field">
              <label className="field-label" htmlFor="g-title">ชื่อเป้าหมาย *</label>
              <input ref={titleRef} id="g-title"
                className={`input ${errors.title ? 'input-error' : ''}`}
                type="text" placeholder="เช่น เก็บเงิน 100,000 บาท"
                value={form.title} maxLength={80}
                onChange={e => field('title', e.target.value)} />
              {errors.title && <p className="field-error">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="field">
              <label className="field-label">หมวดหมู่</label>
              <div className="cat-chip-row">
                {GOAL_CATEGORIES.map(c => (
                  <button key={c.id} type="button"
                    className={`cat-chip-sm ${form.category === c.id ? 'cat-chip-sm--active' : ''}`}
                    onClick={() => field('category', c.id)}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target + Unit + Progress row */}
            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="g-target">เป้าหมาย *</label>
                <input id="g-target"
                  className={`input ${errors.target ? 'input-error' : ''}`}
                  type="number" inputMode="decimal" min="0" placeholder="100000"
                  value={form.target}
                  onChange={e => field('target', e.target.value)} />
                {errors.target && <p className="field-error">{errors.target}</p>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="g-unit">หน่วย *</label>
                <input id="g-unit"
                  className={`input ${errors.unit ? 'input-error' : ''}`}
                  type="text" placeholder="บาท / กม. / เล่ม / %"
                  value={form.unit}
                  onChange={e => field('unit', e.target.value)} />
                {errors.unit && <p className="field-error">{errors.unit}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="g-prog">ค่าปัจจุบัน</label>
                <input id="g-prog"
                  className="input" type="number" inputMode="decimal" min="0"
                  value={form.progress}
                  onChange={e => field('progress', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="g-dl">กำหนด (ไม่บังคับ)</label>
                <input id="g-dl"
                  className="input" type="date"
                  value={form.deadline}
                  onChange={e => field('deadline', e.target.value)} />
              </div>
            </div>

            {/* Note */}
            <div className="field">
              <label className="field-label" htmlFor="g-note">หมายเหตุ</label>
              <textarea id="g-note" className="input textarea" rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
                value={form.note}
                onChange={e => field('note', e.target.value)} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">
                {goal ? '💾 บันทึกการแก้ไข' : '+ เพิ่มเป้าหมาย'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Goal Card
───────────────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete, onProgressUpdate }) {
  const pct     = calcPct(goal.progress, goal.target)
  const catMeta = getCategoryMeta(goal.category)
  const dl      = deadlineLabel(goal.deadline)
  const done    = pct >= 100
  const color   = CATEGORY_COLOR[goal.category] || 'var(--accent-violet2)'
  const fill    = FILL_CLASS[goal.category]     || 'fill-violet'

  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState(String(goal.progress))
  const [confirm,  setConfirm]  = useState(false)

  function handleProgressSave() {
    const v = parseFloat(inputVal)
    if (!isNaN(v) && v >= 0) onProgressUpdate(goal.id, v)
    setEditing(false)
  }

  function handleDelete() {
    if (confirm) { onDelete(goal.id); setConfirm(false) }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 3000) }
  }

  return (
    <div className={`goal-card ${done ? 'goal-card--done' : ''}`}>
      {done && <div className="goal-done-ribbon">✅ สำเร็จ!</div>}

      {/* Header */}
      <div className="goal-card-head">
        <span className="goal-emoji">{goal.emoji || catMeta.emoji}</span>
        <div className="goal-title-wrap">
          <p className="goal-title">{goal.title}</p>
          <span className="goal-cat-tag" style={{ color }}>
            {catMeta.emoji} {catMeta.label}
          </span>
        </div>
        <div className="goal-card-actions">
          <button className="goal-act-btn" onClick={() => onEdit(goal)} title="แก้ไข">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            className={`goal-act-btn goal-act-btn--del ${confirm ? 'goal-act-btn--confirm' : ''}`}
            onClick={handleDelete}
            title={confirm ? 'ยืนยันการลบ' : 'ลบ'}
          >
            {confirm
              ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="goal-progress-wrap">
        <div className="goal-progress-track">
          <div
            className={`progress-fill ${fill}`}
            style={{ width: `${pct}%`, height: '100%', borderRadius: 'var(--r-full)',
              transition: 'width 0.6s var(--ease)' }}
          />
        </div>
        <span className="goal-pct" style={{ color }}>{pct}%</span>
      </div>

      {/* Numbers */}
      <div className="goal-nums">
        {editing ? (
          <div className="goal-edit-row">
            <input
              className="input goal-progress-input"
              type="number" inputMode="decimal" min="0"
              value={inputVal}
              autoFocus
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleProgressSave(); if (e.key === 'Escape') setEditing(false) }}
            />
            <span className="goal-unit">{goal.unit}</span>
            <button className="btn btn-primary btn-size-sm" onClick={handleProgressSave}>✓</button>
            <button className="btn btn-ghost btn-size-sm" onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <button className="goal-progress-tap" onClick={() => { setInputVal(String(goal.progress)); setEditing(true) }}
            title="กดเพื่ออัปเดต progress">
            <span className="goal-current">{formatNum(goal.progress)}</span>
            <span className="goal-sep">/</span>
            <span className="goal-target">{formatNum(goal.target)} {goal.unit}</span>
            <svg className="goal-edit-icon" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Footer: deadline + note */}
      <div className="goal-footer">
        {dl && (
          <span className={`goal-deadline ${dl.urgent ? 'goal-deadline--urgent' : ''}`}>
            📅 {dl.text}
          </span>
        )}
        {goal.note && <span className="goal-note">💬 {goal.note}</span>}
        {done && goal.completedAt && (
          <span className="goal-completed-at">
            🏆 เสร็จเมื่อ {new Date(goal.completedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export default function GoalsPage() {
  const [goals,      setGoals]      = useState(() => goalsService.getAll())
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editGoal,   setEditGoal]   = useState(null)
  const [filterCat,  setFilterCat]  = useState('')
  const [filterTab,  setFilterTab]  = useState('all') // all | active | done
  const [flash,      setFlash]      = useState(null)

  const reload = useCallback(() => setGoals(goalsService.getAll()), [])

  const summary = useMemo(() => goalsService.getSummary(), [goals])

  const visible = useMemo(() => {
    let list = [...goals]
    if (filterCat) list = list.filter(g => g.category === filterCat)
    if (filterTab === 'active') list = list.filter(g => calcPct(g.progress, g.target) < 100)
    if (filterTab === 'done')   list = list.filter(g => calcPct(g.progress, g.target) >= 100)
    return list
  }, [goals, filterCat, filterTab])

  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 2200)
  }

  function handleSaved() {
    reload()
    showFlash(editGoal ? '✅ แก้ไขเป้าหมายแล้ว' : '✅ เพิ่มเป้าหมายแล้ว')
  }
  function handleEdit(goal) { setEditGoal(goal); setModalOpen(true) }
  function handleAdd()      { setEditGoal(null);  setModalOpen(true) }
  function handleDelete(id) {
    goalsService.delete(id); reload()
    showFlash('🗑️ ลบเป้าหมายแล้ว', 'warn')
  }
  function handleProgressUpdate(id, val) {
    goalsService.updateProgress(id, val); reload()
    showFlash('📊 อัปเดต progress แล้ว')
  }

  const TABS = [
    { id: 'all',    label: 'ทั้งหมด',   count: summary.total },
    { id: 'active', label: 'กำลังทำ',   count: summary.active },
    { id: 'done',   label: 'สำเร็จแล้ว', count: summary.completed },
  ]

  return (
    <div className="goals-page">
      {flash && <div className={`wo-toast wo-toast--${flash.type}`}>{flash.msg}</div>}

      <GoalModal
        open={modalOpen}
        goal={editGoal}
        onClose={() => { setModalOpen(false); setEditGoal(null) }}
        onSaved={handleSaved}
      />

      {/* ── Header row ── */}
      <div className="goals-header">
        <div className="goals-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab"
              aria-selected={filterTab === t.id}
              className={`todo-tab ${filterTab === t.id ? 'todo-tab--active' : ''}`}
              onClick={() => setFilterTab(t.id)}>
              {t.label}
              <span className="todo-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="goals-cat-filter">
          <button
            className={`filter-chip ${!filterCat ? 'filter-chip--active' : ''}`}
            onClick={() => setFilterCat('')}>ทั้งหมด</button>
          {GOAL_CATEGORIES.map(c => (
            <button key={c.id}
              className={`filter-chip ${filterCat === c.id ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterCat(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <button className="btn btn-primary goals-add-btn" onClick={handleAdd}>
          + เพิ่มเป้าหมาย
        </button>
      </div>

      {/* ── Card grid ── */}
      {visible.length === 0 ? (
        <div className="goals-empty">
          <span className="goals-empty-icon">🎯</span>
          <p>{filterTab === 'done' ? 'ยังไม่มีเป้าหมายที่สำเร็จ' : 'ยังไม่มีเป้าหมาย'}</p>
          <span>กดปุ่ม "+ เพิ่มเป้าหมาย" เพื่อเริ่มต้น</span>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={handleAdd}>
            + เพิ่มเป้าหมายแรก
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {visible.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
