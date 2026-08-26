import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { todoService, subTaskService } from '../../services/todoService.js'
import {
  PRIORITIES, TODO_CATEGORIES,
  getPriorityMeta, getCategoryMeta,
  todayISO, formatDateTH,
  isOverdue, isDueToday,
  applyFilters, validateTodo,
} from './todoUtils.js'
import './TodoPage.css'

/* ─────────────────────────────────────────────────────────
   Small atoms
───────────────────────────────────────────────────────── */

function PriorityPill({ id }) {
  const m = getPriorityMeta(id)
  return (
    <span className={`priority-pill priority-pill--${id}`}>
      {m.emoji} {m.label}
    </span>
  )
}

function CategoryTag({ id }) {
  const m = getCategoryMeta(id)
  return (
    <span className="cat-tag">
      {m.emoji} {m.label}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────
   Add / Edit Form
───────────────────────────────────────────────────────── */
function TodoForm({ editTarget, onSaved, onCancelEdit }) {
  const isEdit = !!editTarget
  const [form, setForm] = useState({
    title:    editTarget?.title    ?? '',
    priority: editTarget?.priority ?? 'medium',
    category: editTarget?.category ?? '',
    dueDate:  editTarget?.dueDate  ?? '',
    note:     editTarget?.note     ?? '',
  })
  const [errors, setErrors] = useState({})
  const titleRef = useRef(null)

  // Focus title on mount or when editTarget changes
  useEffect(() => {
    titleRef.current?.focus()
  }, [editTarget?.id])

  function field(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validateTodo(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      title:    form.title.trim(),
      priority: form.priority,
      category: form.category || null,
      dueDate:  form.dueDate  || null,
      note:     form.note.trim() || null,
    }

    if (isEdit) {
      todoService.update(editTarget.id, payload)
    } else {
      todoService.add(payload)
    }
    onSaved()
    if (!isEdit) setForm({ title: '', priority: 'medium', category: '', dueDate: '', note: '' })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="todo-form">
      <h3 className="todo-form-title">
        {isEdit ? '✏️ แก้ไขงาน' : '➕ เพิ่มงานใหม่'}
      </h3>

      {/* Title */}
      <div className="field">
        <label className="field-label" htmlFor="todo-title">ชื่องาน *</label>
        <input
          id="todo-title"
          ref={titleRef}
          className={`input ${errors.title ? 'input-error' : ''}`}
          type="text"
          placeholder="เช่น ออกกำลังกาย 30 นาที..."
          value={form.title}
          onChange={e => field('title', e.target.value)}
          maxLength={120}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      {/* Priority */}
      <div className="field">
        <label className="field-label">ความสำคัญ</label>
        <div className="priority-group" role="group" aria-label="ความสำคัญ">
          {PRIORITIES.map(p => (
            <button
              key={p.id}
              type="button"
              className={`priority-btn priority-btn--${p.id} ${form.priority === p.id ? 'priority-btn--active' : ''}`}
              onClick={() => field('priority', p.id)}
              aria-pressed={form.priority === p.id}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="field">
        <label className="field-label">หมวดหมู่</label>
        <div className="cat-chip-row">
          <button
            type="button"
            className={`cat-chip-sm ${!form.category ? 'cat-chip-sm--active' : ''}`}
            onClick={() => field('category', '')}
          >ทั้งหมด</button>
          {TODO_CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              className={`cat-chip-sm ${form.category === c.id ? 'cat-chip-sm--active' : ''}`}
              onClick={() => field('category', c.id)}
              aria-pressed={form.category === c.id}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Due date */}
      <div className="field">
        <label className="field-label" htmlFor="todo-due">กำหนดส่ง (ไม่บังคับ)</label>
        <input
          id="todo-due"
          className="input"
          type="date"
          value={form.dueDate}
          onChange={e => field('dueDate', e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="field">
        <label className="field-label" htmlFor="todo-note">หมายเหตุ (ไม่บังคับ)</label>
        <textarea
          id="todo-note"
          className="input textarea"
          placeholder="รายละเอียดเพิ่มเติม..."
          value={form.note}
          rows={2}
          onChange={e => field('note', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="todo-form-actions">
        {isEdit && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn btn-primary todo-submit">
          {isEdit ? '💾 บันทึกการแก้ไข' : '+ เพิ่มงาน'}
        </button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────
   Filter Panel
───────────────────────────────────────────────────────── */
function FilterPanel({ filters, onChange, counts }) {
  const tabs = [
    { id: 'all',       label: 'ทั้งหมด',    count: counts.total },
    { id: 'pending',   label: 'ค้าง',       count: counts.pending },
    { id: 'completed', label: 'เสร็จแล้ว',  count: counts.completed },
  ]

  return (
    <div className="filter-panel">
      {/* Tab bar */}
      <div className="todo-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={filters.tab === t.id}
            className={`todo-tab ${filters.tab === t.id ? 'todo-tab--active' : ''}`}
            onClick={() => onChange('tab', t.id)}
          >
            {t.label}
            <span className="todo-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="field-wrap has-prefix">
        <span className="field-prefix">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="input todo-search"
          type="search"
          placeholder="ค้นหางาน..."
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
        />
      </div>

      {/* Priority filter */}
      <div className="filter-row">
        <span className="filter-label">Priority</span>
        <div className="filter-chips">
          <button
            className={`filter-chip ${!filters.priority ? 'filter-chip--active' : ''}`}
            onClick={() => onChange('priority', '')}
          >ทั้งหมด</button>
          {PRIORITIES.map(p => (
            <button
              key={p.id}
              className={`filter-chip filter-chip--${p.id} ${filters.priority === p.id ? 'filter-chip--active' : ''}`}
              onClick={() => onChange('priority', p.id)}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="filter-row">
        <span className="filter-label">หมวดหมู่</span>
        <div className="filter-chips">
          <button
            className={`filter-chip ${!filters.category ? 'filter-chip--active' : ''}`}
            onClick={() => onChange('category', '')}
          >ทั้งหมด</button>
          {TODO_CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`filter-chip ${filters.category === c.id ? 'filter-chip--active' : ''}`}
              onClick={() => onChange('category', c.id)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Sub-task list inside a TodoItem
───────────────────────────────────────────────────────── */
function SubTaskList({ todoId, subTasks = [], onReload }) {
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef(null)

  function handleAdd(e) {
    e.preventDefault()
    const t = newTitle.trim()
    if (!t) return
    subTaskService.add(todoId, t)
    setNewTitle('')
    onReload()
    inputRef.current?.focus()
  }

  function handleToggle(subId) {
    subTaskService.toggle(todoId, subId)
    onReload()
  }

  function handleDelete(subId) {
    subTaskService.delete(todoId, subId)
    onReload()
  }

  return (
    <div className="sub-task-list">
      {subTasks.map(s => (
        <div key={s.id} className={`sub-task-row ${s.completed ? 'sub-task-row--done' : ''}`}>
          <button
            className={`sub-task-check ${s.completed ? 'sub-task-check--done' : ''}`}
            onClick={() => handleToggle(s.id)}
            aria-label={s.completed ? 'ยกเลิก' : 'เสร็จ'}
          >
            {s.completed && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            )}
          </button>
          <span className="sub-task-title">{s.title}</span>
          <button className="sub-task-del" onClick={() => handleDelete(s.id)} title="ลบ">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      <form onSubmit={handleAdd} className="sub-task-add-row">
        <input
          ref={inputRef}
          className="sub-task-input"
          type="text"
          placeholder="+ เพิ่ม sub-task..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          maxLength={100}
        />
        {newTitle.trim() && (
          <button type="submit" className="sub-task-add-btn">เพิ่ม</button>
        )}
      </form>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Todo Item Row
───────────────────────────────────────────────────────── */
function TodoItem({ todo, onToggle, onEdit, onDelete, deleteConfirm, onDeleteClick, onReload }) {
  const overdue   = isOverdue(todo)
  const dueToday  = isDueToday(todo)
  const isConfirm = deleteConfirm === todo.id
  const [expanded, setExpanded] = useState(false)

  const subs      = todo.subTasks || []
  const subDone   = subs.filter(s => s.completed).length
  const subTotal  = subs.length
  const subPct    = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0

  return (
    <div
      className={[
        'todo-item',
        todo.completed ? 'todo-item--done' : '',
        overdue        ? 'todo-item--overdue' : '',
        dueToday && !todo.completed ? 'todo-item--today' : '',
        expanded ? 'todo-item--expanded' : '',
      ].join(' ')}
    >
      <div className="todo-item-main">
        {/* Checkbox */}
        <button
          className={`todo-checkbox priority-${todo.priority} ${todo.completed ? 'todo-checkbox--done' : ''}`}
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
          title={todo.completed ? 'กลับไปค้าง' : 'ทำเครื่องหมายว่าเสร็จ'}
        >
          {todo.completed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="todo-item-body">
          <p className="todo-item-title">{todo.title}</p>
          <div className="todo-item-meta">
            {todo.priority && <PriorityPill id={todo.priority} />}
            {todo.category && <CategoryTag id={todo.category} />}
            {todo.dueDate && (
              <span className={`todo-due ${overdue ? 'todo-due--overdue' : ''} ${dueToday ? 'todo-due--today' : ''}`}>
                📅 {overdue ? '⚠ ' : ''}{formatDateTH(todo.dueDate)}
              </span>
            )}
            {todo.note && (
              <span className="todo-note-preview" title={todo.note}>
                💬 {todo.note}
              </span>
            )}
            {/* Sub-task progress badge */}
            {subTotal > 0 && (
              <button
                className={`sub-task-badge ${subDone === subTotal ? 'sub-task-badge--done' : ''}`}
                onClick={() => setExpanded(v => !v)}
                title={expanded ? 'ซ่อน sub-tasks' : 'แสดง sub-tasks'}
              >
                ☑ {subDone}/{subTotal}
                <span className="sub-task-badge-bar">
                  <span style={{ width: `${subPct}%` }} />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="todo-item-actions">
          {/* Sub-task toggle (always visible) */}
          <button
            className={`todo-action-btn ${expanded ? 'todo-action-btn--active' : ''}`}
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'ซ่อน sub-tasks' : 'Sub-tasks'}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </button>
          <button
            className="todo-action-btn"
            onClick={() => onEdit(todo)}
            aria-label="แก้ไขงาน"
            title="แก้ไข"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            className={`todo-action-btn todo-action-btn--delete ${isConfirm ? 'todo-action-btn--confirm' : ''}`}
            onClick={() => onDeleteClick(todo.id)}
            aria-label={isConfirm ? 'ยืนยันการลบ' : 'ลบงาน'}
            title={isConfirm ? 'กดอีกครั้งเพื่อยืนยัน' : 'ลบ'}
          >
            {isConfirm ? (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expanded sub-task section */}
      {expanded && (
        <SubTaskList todoId={todo.id} subTasks={subs} onReload={onReload} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
const DEFAULT_FILTERS = { tab: 'all', category: '', priority: '', search: '' }

export default function TodoPage() {
  const [todos,         setTodos]         = useState(() => todoService.getAll())
  const [editTarget,    setEditTarget]    = useState(null)
  const [filters,       setFilters]       = useState(DEFAULT_FILTERS)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [flash,         setFlash]         = useState(null)

  const reload = useCallback(() => setTodos(todoService.getAll()), [])

  /* counts (always from all todos, ignore tab filter) */
  const counts = useMemo(() => {
    const total     = todos.length
    const completed = todos.filter(t => t.completed).length
    return { total, completed, pending: total - completed }
  }, [todos])

  /* filtered + sorted list */
  const visible = useMemo(
    () => applyFilters(todos, filters),
    [todos, filters]
  )

  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 2200)
  }

  function handleFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  function handleSaved() {
    reload()
    setEditTarget(null)
    showFlash(editTarget ? '✅ แก้ไขงานแล้ว' : '✅ เพิ่มงานแล้ว')
  }

  function handleToggle(id) {
    todoService.toggle(id)
    reload()
  }

  function handleEdit(todo) {
    setEditTarget(todo)
    // On mobile, scroll form into view
    document.querySelector('.todo-form-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleDeleteClick(id) {
    if (deleteConfirm === id) {
      todoService.delete(id)
      reload()
      setDeleteConfirm(null)
      if (editTarget?.id === id) setEditTarget(null)
      showFlash('🗑️ ลบงานแล้ว', 'warn')
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="todo-page">

      {/* Toast */}
      {flash && (
        <div className={`todo-toast todo-toast--${flash.type}`}>{flash.msg}</div>
      )}

      <div className="todo-layout">

        {/* ══════════════════════════════
            LEFT PANEL — Form + Filters
        ══════════════════════════════ */}
        <aside className="todo-form-panel">

          {/* Add / Edit Form */}
          <div className="card card-pad-lg">
            <TodoForm
              editTarget={editTarget}
              onSaved={handleSaved}
              onCancelEdit={() => setEditTarget(null)}
            />
          </div>

          {/* Filter Panel */}
          <div className="card card-pad-lg">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              counts={counts}
            />
          </div>

        </aside>

        {/* ══════════════════════════════
            RIGHT PANEL — Todo List
        ══════════════════════════════ */}
        <section className="todo-list-panel">
          <div className="todo-list-header">
            <span className="section-label">
              {filters.tab === 'completed' ? 'เสร็จแล้ว' :
               filters.tab === 'pending'   ? 'งานค้าง'  : 'งานทั้งหมด'}
            </span>
            <span className="badge">{visible.length} รายการ</span>
          </div>

          {visible.length === 0 ? (
            <div className="todo-empty">
              <span className="todo-empty-icon">
                {filters.tab === 'completed' ? '🏆' : '🎯'}
              </span>
              <p>
                {filters.tab === 'completed' ? 'ยังไม่มีงานที่เสร็จ' :
                 filters.search             ? `ไม่พบงานที่ตรงกับ "${filters.search}"` :
                                              'ไม่มีงานในตอนนี้'}
              </p>
              {filters.tab !== 'completed' && !filters.search && (
                <span>เพิ่มงานใหม่ได้จากฟอร์มด้านซ้าย 👈</span>
              )}
            </div>
          ) : (
            <div className="todo-items">
              {visible.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={id => { todoService.delete(id); reload() }}
                  deleteConfirm={deleteConfirm}
                  onDeleteClick={handleDeleteClick}
                  onReload={reload}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
