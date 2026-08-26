import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { todoService }    from '../../services/todoService.js'
import { habitService }   from '../../services/habitService.js'
import { storageGet, STORAGE_KEYS } from '../../services/storageService.js'
import './GlobalSearch.css'

/* ── Search all data sources ── */
function searchAll(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results = []

  todoService.getAll().forEach(t => {
    if (t.title?.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q)) {
      results.push({ id: t.id, type: 'todo', icon: t.completed ? '✅' : '☐', title: t.title, sub: t.note || (t.completed ? 'เสร็จแล้ว' : 'ยังค้างอยู่'), path: '/todo', accent: 'blue' })
    }
  })

  storageGet(STORAGE_KEYS.FINANCE, []).forEach(e => {
    const text = [e.description, e.note, e.category].filter(Boolean).join(' ').toLowerCase()
    if (text.includes(q)) {
      results.push({ id: e.id, type: 'finance', icon: e.type === 'income' ? '💰' : '💸', title: e.description || e.category, sub: (e.type === 'income' ? '+' : '-') + '฿' + Number(e.amount).toLocaleString('th-TH'), path: '/finance', accent: 'green' })
    }
  })

  habitService.getAll().forEach(h => {
    if (h.title?.toLowerCase().includes(q) || h.note?.toLowerCase().includes(q)) {
      results.push({ id: h.id, type: 'habit', icon: h.emoji || '🔁', title: h.title, sub: h.category || 'Habit', path: '/habits', accent: 'amber' })
    }
  })

  storageGet(STORAGE_KEYS.GOALS, []).forEach(g => {
    const text = [g.title, g.description, g.note].filter(Boolean).join(' ').toLowerCase()
    if (text.includes(q)) {
      results.push({ id: g.id, type: 'goal', icon: '🎯', title: g.title, sub: g.description || 'เป้าหมาย', path: '/goals', accent: 'teal' })
    }
  })

  return results.slice(0, 20)
}

const TYPE_LABEL = { todo: 'To-Do', finance: 'การเงิน', habit: 'Habits', goal: 'เป้าหมาย' }

export default function GlobalSearch({ open, onClose }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery(''); setResults([]); setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSelected(0); return }
    setResults(searchAll(query))
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape')    { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && results[selected]) handleSelect(results[selected])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, selected])

  function handleSelect(item) {
    navigate(item.path)
    onClose()
    setQuery('')
  }

  if (!open) return null

  const grouped = results.reduce((acc, r, idx) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push({ ...r, _idx: idx })
    return acc
  }, {})

  return (
    <div className="gs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gs-modal" role="dialog" aria-label="Global search">
        <div className="gs-input-row">
          <svg className="gs-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            className="gs-input"
            type="search"
            placeholder="ค้นหาทุกอย่าง... (Todo, การเงิน, Habits)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button className="gs-clear" onClick={() => setQuery('')} aria-label="clear">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <kbd className="gs-esc" onClick={onClose}>Esc</kbd>
        </div>

        {query && (
          <div className="gs-results">
            {results.length === 0 ? (
              <div className="gs-empty">
                <span>🔍</span>
                <p>ไม่พบผลลัพธ์สำหรับ "{query}"</p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="gs-group">
                  <p className="gs-group-label">{TYPE_LABEL[type] || type}</p>
                  {items.map(item => (
                    <button
                      key={item.id}
                      className={"gs-result-row gs-result-row--" + item.accent + " " + (selected === item._idx ? 'gs-result-row--selected' : '')}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelected(item._idx)}
                    >
                      <span className="gs-result-icon">{item.icon}</span>
                      <span className="gs-result-body">
                        <span className="gs-result-title">{item.title}</span>
                        <span className="gs-result-sub">{item.sub}</span>
                      </span>
                      <span className="gs-result-type">{TYPE_LABEL[item.type]}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        <div className="gs-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> เลือก</span>
          <span><kbd>Enter</kbd> ไปหน้า</span>
          <span><kbd>Esc</kbd> ปิด</span>
        </div>
      </div>
    </div>
  )
}
