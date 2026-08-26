import React, { useState, useMemo, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { healthService, sleepService } from '../../services/healthService.js'
import { appDataService }  from '../../services/appDataService.js'
import {
  WATER_QUICK_ML, DEFAULT_WATER_GOAL_ML,
  formatWater, waterProgress, weightTrend,
  todayISO, formatDateTH, validateWeight,
  calcSleepDuration, formatDuration,
} from './healthUtils.js'
import './HealthPage.css'

/* ── Water Tracker card ── */
function WaterCard({ todayMl, goalMl, onAdd, onSetGoal }) {
  const pct = waterProgress(todayMl, goalMl)
  const [customMl, setCustomMl] = useState('')

  function handleCustomAdd() {
    const n = parseInt(customMl, 10)
    if (n > 0 && n <= 5000) { onAdd(n); setCustomMl('') }
  }

  const segments = 8
  const filled   = Math.round((pct / 100) * segments)

  return (
    <div className="card card-pad-lg h-water-card">
      <div className="h-card-header">
        <p className="section-label">💧 น้ำดื่มวันนี้</p>
        <button
          className="h-goal-btn"
          onClick={onSetGoal}
          title="ตั้งเป้าน้ำดื่ม"
        >⚙️ เป้า {formatWater(goalMl)}</button>
      </div>

      {/* Big number */}
      <div className="water-display">
        <span className="water-num">{formatWater(todayMl)}</span>
        <span className="water-goal-text">จาก {formatWater(goalMl)}</span>
      </div>

      {/* Segment progress */}
      <div className="water-segments" aria-label={`ดื่มน้ำ ${pct}%`}>
        {Array.from({ length: segments }, (_, i) => (
          <div key={i} className={`water-seg ${i < filled ? 'water-seg--filled' : ''}`} />
        ))}
      </div>
      <p className="water-pct">{pct}%</p>

      {/* Progress bar */}
      <div className="progress-track" style={{ height: 10, marginTop: 4 }}>
        <div
          className="progress-fill fill-teal"
          style={{ width: `${pct}%`, height: '100%' }}
        />
      </div>

      {/* Quick add */}
      <div className="water-quick">
        {WATER_QUICK_ML.map(ml => (
          <button key={ml} className="water-quick-btn" onClick={() => onAdd(ml)}>
            +{formatWater(ml)}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="water-custom">
        <input
          className="input water-custom-input"
          type="number"
          inputMode="numeric"
          min="1" max="5000"
          placeholder="กำหนดเอง (มล.)"
          value={customMl}
          onChange={e => setCustomMl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
        />
        <button className="btn btn-primary water-custom-add" onClick={handleCustomAdd}>
          + เพิ่ม
        </button>
      </div>
    </div>
  )
}

/* ── Weight entry card ── */
function WeightFormCard({ onSaved }) {
  const [form, setForm]   = useState({ weight: '', note: '', date: todayISO() })
  const [errors, setErrors] = useState({})

  function field(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validateWeight(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    healthService.addWeight({
      weight: parseFloat(form.weight),
      note:   form.note.trim() || null,
      date:   new Date(form.date).toISOString(),
    })
    setForm({ weight: '', note: '', date: todayISO() })
    setErrors({})
    onSaved()
  }

  return (
    <div className="card card-pad-lg">
      <p className="section-label" style={{ marginBottom: 16 }}>⚖️ บันทึกน้ำหนัก</p>
      <form onSubmit={handleSubmit} noValidate className="weight-form">
        <div className="field">
          <label className="field-label" htmlFor="h-weight">น้ำหนัก (kg)</label>
          <div className="field-wrap has-suffix">
            <input
              id="h-weight"
              className={`input weight-input ${errors.weight ? 'input-error' : ''}`}
              type="number" inputMode="decimal"
              step="0.1" min="1" max="500"
              placeholder="68.5"
              value={form.weight}
              onChange={e => field('weight', e.target.value)}
            />
            <span className="field-suffix">kg</span>
          </div>
          {errors.weight && <p className="field-error">{errors.weight}</p>}
        </div>

        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="h-date">วันที่</label>
            <input
              id="h-date"
              className="input"
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={e => field('date', e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="h-note">หมายเหตุ</label>
            <input
              id="h-note"
              className="input"
              type="text"
              placeholder="เช่น เช้า ก่อนกินข้าว"
              value={form.note}
              onChange={e => field('note', e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary weight-submit">
          + บันทึกน้ำหนัก
        </button>
      </form>
    </div>
  )
}

/* ── Weight stats card ── */
function WeightStatsCard({ latest, goalWeight, history }) {
  const trend  = useMemo(() => weightTrend(history), [history])
  const diff   = goalWeight && latest ? +(latest - goalWeight).toFixed(1) : null
  const goalPct = goalWeight && history.length >= 2
    ? Math.max(0, Math.min(100, Math.round(
        ((history[0].weight - latest) / (history[0].weight - goalWeight)) * 100
      )))
    : null

  return (
    <div className="card card-pad-lg weight-stats-card">
      <p className="section-label" style={{ marginBottom: 16 }}>📊 ภาพรวมน้ำหนัก</p>

      <div className="ws-grid">
        <div className="ws-cell">
          <p className="ws-label">ล่าสุด</p>
          <p className="ws-val">{latest != null ? `${latest} kg` : '—'}</p>
        </div>
        <div className="ws-cell">
          <p className="ws-label">เทรนด์ 30 วัน</p>
          <p className={`ws-val ${trend != null ? (trend > 0 ? 'ws-up' : trend < 0 ? 'ws-down' : '') : ''}`}>
            {trend != null ? `${trend > 0 ? '+' : ''}${trend} kg` : '—'}
          </p>
        </div>
        <div className="ws-cell">
          <p className="ws-label">เป้าหมาย</p>
          <p className="ws-val">{goalWeight ? `${goalWeight} kg` : '—'}</p>
        </div>
        <div className="ws-cell">
          <p className="ws-label">ห่างจากเป้า</p>
          <p className={`ws-val ${diff != null ? (diff > 0 ? 'ws-up' : 'ws-down') : ''}`}>
            {diff != null ? `${diff > 0 ? '+' : ''}${diff} kg` : '—'}
          </p>
        </div>
      </div>

      {goalPct != null && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="filter-label">ความคืบหน้าสู่เป้าหมาย</span>
            <span className="filter-label">{goalPct}%</span>
          </div>
          <div className="progress-track" style={{ height: 10 }}>
            <div className="progress-fill fill-violet" style={{ width: `${goalPct}%`, height: '100%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Weight chart ── */
function WeightChart({ history }) {
  if (history.length < 2) return (
    <div className="card card-pad-lg">
      <p className="section-label">📈 กราฟน้ำหนัก</p>
      <div className="wo-empty" style={{ padding: 'var(--space-xl)' }}>
        <span>📉</span>
        <p>บันทึกน้ำหนักอย่างน้อย 2 ครั้งเพื่อดูกราฟ</p>
      </div>
    </div>
  )

  const data = history.map(e => ({
    date:   new Date(e.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    weight: e.weight,
  }))

  const weights   = history.map(h => h.weight)
  const minW = Math.floor(Math.min(...weights) - 1)
  const maxW = Math.ceil(Math.max(...weights)  + 1)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0 }}>{label}</p>
        <p style={{ margin: '4px 0 0', color: 'var(--accent-violet2)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          {payload[0].value} kg
        </p>
      </div>
    )
  }

  return (
    <div className="card card-pad-lg">
      <p className="section-label" style={{ marginBottom: 16 }}>📈 กราฟน้ำหนัก (30 วัน)</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--accent-violet2)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent-violet2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[minW, maxW]} tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="weight" stroke="var(--accent-violet2)" fill="url(#wg)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent-violet2)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Weight history list ── */
function WeightHistory({ history, onDelete }) {
  const [confirmId, setConfirmId] = useState(null)

  function handleClick(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 3000) }
  }

  const sorted = [...history].reverse() // newest first
  return (
    <div className="card card-pad-lg">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p className="section-label">ประวัติน้ำหนัก</p>
        <span className="badge">{history.length} รายการ</span>
      </div>
      {sorted.length === 0 ? (
        <div className="wo-empty"><span>⚖️</span><p>ยังไม่มีข้อมูลน้ำหนัก</p></div>
      ) : (
        <div className="wh-list">
          {sorted.slice(0, 20).map(e => (
            <div key={e.id} className="wh-row">
              <div className="wh-info">
                <span className="wh-weight">{e.weight} kg</span>
                {e.note && <span className="wh-note">{e.note}</span>}
                <span className="wh-date">{formatDateTH(e.date)}</span>
              </div>
              <button
                className={`session-del ${confirmId === e.id ? 'session-del--confirm' : ''}`}
                onClick={() => handleClick(e.id)}
                title={confirmId === e.id ? 'ยืนยันการลบ' : 'ลบ'}
              >
                {confirmId === e.id
                  ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Goal modal (water + weight targets) ── */
function GoalModal({ open, goalMl, goalWeight, onClose, onSave }) {
  const [wml, setWml] = useState(String(goalMl))
  const [wkg, setWkg] = useState(String(goalWeight ?? ''))

  if (!open) return null
  function handleSave() {
    const ml = parseInt(wml, 10)
    const kg = parseFloat(wkg)
    onSave(
      ml > 0 ? ml : goalMl,
      wkg.trim() && !isNaN(kg) && kg > 0 ? kg : null
    )
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3 className="modal-title">⚙️ ตั้งค่าเป้าหมาย</h3>
          <button className="btn btn-icon modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label">เป้าน้ำดื่มต่อวัน (มล.)</label>
            <input className="input" type="number" min="500" max="10000" value={wml} onChange={e => setWml(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">น้ำหนักเป้าหมาย (kg) — ไม่บังคับ</label>
            <input className="input" type="number" step="0.1" min="30" max="300" placeholder="เช่น 65.0" value={wkg} onChange={e => setWkg(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={handleSave}>💾 บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sleep Tracker ── */
function SleepSection({ logs, summary, onAdd, onDelete }) {
  const [form, setForm] = useState({ date: todayISO(), bedtime: '23:00', wakeTime: '07:00', quality: '3', note: '' })
  const [confirmId, setConfirmId] = useState(null)
  const [error, setError] = useState('')

  const duration = calcSleepDuration(form.bedtime, form.wakeTime)

  function field(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.bedtime || !form.wakeTime) { setError('กรุณาระบุเวลานอนและตื่น'); return }
    if (duration <= 0 || duration > 1440) { setError('เวลาไม่ถูกต้อง'); return }
    onAdd({ date: form.date, bedtime: form.bedtime, wakeTime: form.wakeTime, durationMin: duration, quality: parseInt(form.quality), note: form.note.trim() || null })
    setForm({ date: todayISO(), bedtime: '23:00', wakeTime: '07:00', quality: '3', note: '' })
    setError('')
  }

  function handleDel(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 3000) }
  }

  const QUALITY_LABELS = ['', '😴 แย่มาก', '😐 แย่', '😊 ปานกลาง', '😁 ดี', '🌟 ดีมาก']
  const qualityColor = q => q >= 4 ? 'var(--accent-green)' : q === 3 ? 'var(--accent-amber)' : 'var(--accent-rose)'

  return (
    <div className="sleep-section">
      {/* Stats bar */}
      <div className="sleep-stats-bar card card-pad-lg">
        <p className="section-label" style={{ marginBottom: 12 }}>😴 Sleep Tracker</p>
        <div className="sleep-stats-row">
          <div className="sleep-stat">
            <span className="sleep-stat-num">{summary.avg != null ? formatDuration(summary.avg) : '—'}</span>
            <span className="sleep-stat-lbl">เฉลี่ย 7 วัน</span>
          </div>
          <div className="sleep-stat-div" />
          <div className="sleep-stat">
            <span className="sleep-stat-num" style={{ color: 'var(--accent-green)' }}>{summary.best != null ? formatDuration(summary.best) : '—'}</span>
            <span className="sleep-stat-lbl">ดีที่สุด</span>
          </div>
          <div className="sleep-stat-div" />
          <div className="sleep-stat">
            <span className="sleep-stat-num" style={{ color: 'var(--accent-rose)' }}>{summary.worst != null ? formatDuration(summary.worst) : '—'}</span>
            <span className="sleep-stat-lbl">น้อยที่สุด</span>
          </div>
          <div className="sleep-stat-div" />
          <div className="sleep-stat">
            <span className="sleep-stat-num">{summary.count}</span>
            <span className="sleep-stat-lbl">วันที่บันทึก</span>
          </div>
        </div>
      </div>

      <div className="sleep-body">
        {/* Form */}
        <div className="card card-pad-lg sleep-form-card">
          <p className="section-label" style={{ marginBottom: 14 }}>🌙 บันทึกการนอน</p>
          <form onSubmit={handleSubmit} noValidate className="sleep-form">
            <div className="field">
              <label className="field-label">วันที่</label>
              <input className="input" type="date" value={form.date} max={todayISO()} onChange={e => field('date', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="field">
                <label className="field-label">⏰ เข้านอน</label>
                <input className="input" type="time" value={form.bedtime} onChange={e => field('bedtime', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">☀️ ตื่นนอน</label>
                <input className="input" type="time" value={form.wakeTime} onChange={e => field('wakeTime', e.target.value)} />
              </div>
            </div>

            {/* Duration preview */}
            {duration > 0 && (
              <div className="sleep-duration-preview">
                <span className="sleep-dur-icon">💤</span>
                <span className="sleep-dur-val">{formatDuration(duration)}</span>
                <span className="sleep-dur-lbl">ชั่วโมงนอน</span>
                <div className="sleep-dur-bar-wrap">
                  <div className="sleep-dur-bar" style={{ width: `${Math.min(100, (duration / 480) * 100)}%`, background: duration >= 420 ? 'var(--accent-green)' : duration >= 300 ? 'var(--accent-amber)' : 'var(--accent-rose)' }} />
                </div>
              </div>
            )}

            <div className="field">
              <label className="field-label">คุณภาพการนอน</label>
              <div className="sleep-quality-row">
                {[1,2,3,4,5].map(q => (
                  <button key={q} type="button"
                    className={`sleep-quality-btn ${form.quality == q ? 'sleep-quality-btn--active' : ''}`}
                    style={{ '--qc': qualityColor(q) }}
                    onClick={() => field('quality', String(q))}
                    title={QUALITY_LABELS[q]}
                  >{QUALITY_LABELS[q]}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">หมายเหตุ (ไม่บังคับ)</label>
              <input className="input" type="text" placeholder="เช่น นอนหลับยาก, ตื่นกลางคืน" value={form.note} onChange={e => field('note', e.target.value)} />
            </div>

            {error && <p className="field-error">{error}</p>}
            <button type="submit" className="btn btn-primary">+ บันทึกการนอน</button>
          </form>
        </div>

        {/* History */}
        <div className="card card-pad-lg sleep-history-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="section-label">📋 ประวัติการนอน</p>
            <span className="badge">{logs.length} รายการ</span>
          </div>
          {logs.length === 0 ? (
            <div className="wo-empty"><span>🌙</span><p>ยังไม่มีข้อมูลการนอน</p></div>
          ) : (
            <div className="sleep-log-list">
              {logs.slice(0, 14).map(e => (
                <div key={e.id} className="sleep-log-row">
                  <div className="sleep-log-info">
                    <span className="sleep-log-date">{formatDateTH(e.date)}</span>
                    <span className="sleep-log-time">{e.bedtime} → {e.wakeTime}</span>
                    {e.note && <span className="sleep-log-note">{e.note}</span>}
                  </div>
                  <div className="sleep-log-right">
                    <div className="sleep-log-dur-bar-wrap">
                      <div className="sleep-log-dur-bar" style={{ width: `${Math.min(100, (e.durationMin / 480) * 100)}%`, background: e.durationMin >= 420 ? 'var(--accent-green)' : e.durationMin >= 300 ? 'var(--accent-amber)' : 'var(--accent-rose)' }} />
                    </div>
                    <span className="sleep-log-dur">{formatDuration(e.durationMin)}</span>
                    {e.quality && <span className="sleep-log-qual" title={QUALITY_LABELS[e.quality]}>{QUALITY_LABELS[e.quality]}</span>}
                    <button
                      className={`session-del ${confirmId === e.id ? 'session-del--confirm' : ''}`}
                      onClick={() => handleDel(e.id)}
                    >
                      {confirmId === e.id
                        ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function HealthPage() {
  const settings = appDataService.getSettings()
  const [goalMl,     setGoalMl]     = useState(settings.waterGoalMl ?? DEFAULT_WATER_GOAL_ML)
  const [goalWeight, setGoalWeight] = useState(settings.goalWeight   ?? null)
  const [todayMl,    setTodayMl]    = useState(() => healthService.getTodayWater())
  const [history,    setHistory]    = useState(() => healthService.getWeightHistory(30))
  const [latest,     setLatest]     = useState(() => healthService.getLatestWeight())
  const [goalOpen,   setGoalOpen]   = useState(false)
  const [flash,      setFlash]      = useState(null)
  const [sleepLogs,  setSleepLogs]  = useState(() => sleepService.getHistory(14))
  const [sleepSum,   setSleepSum]   = useState(() => sleepService.getSummary(7))

  const reload = useCallback(() => {
    setTodayMl(healthService.getTodayWater())
    setHistory(healthService.getWeightHistory(30))
    setLatest(healthService.getLatestWeight())
    setSleepLogs(sleepService.getHistory(14))
    setSleepSum(sleepService.getSummary(7))
  }, [])

  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 2200)
  }

  function handleAddWater(ml) {
    healthService.addWater(ml)
    setTodayMl(healthService.getTodayWater())
    showFlash(`💧 +${formatWater(ml)}`)
  }

  function handleWeightSaved() {
    reload()
    showFlash('✅ บันทึกน้ำหนักแล้ว')
  }

  function handleDeleteWeight(id) {
    healthService.delete(id)
    reload()
    showFlash('🗑️ ลบรายการแล้ว', 'warn')
  }

  function handleSaveGoals(ml, kg) {
    setGoalMl(ml)
    setGoalWeight(kg)
    appDataService.updateSettings({ waterGoalMl: ml, goalWeight: kg })
    showFlash('✅ บันทึกเป้าหมายแล้ว')
  }

  function handleAddSleep(entry) {
    sleepService.add(entry)
    setSleepLogs(sleepService.getHistory(14))
    setSleepSum(sleepService.getSummary(7))
    showFlash('✅ บันทึกการนอนแล้ว')
  }

  function handleDeleteSleep(id) {
    sleepService.delete(id)
    setSleepLogs(sleepService.getHistory(14))
    setSleepSum(sleepService.getSummary(7))
    showFlash('🗑️ ลบรายการแล้ว', 'warn')
  }

  return (
    <div className="h-page">
      {flash && <div className={`wo-toast wo-toast--${flash.type}`}>{flash.msg}</div>}

      <GoalModal
        open={goalOpen}
        goalMl={goalMl}
        goalWeight={goalWeight}
        onClose={() => setGoalOpen(false)}
        onSave={handleSaveGoals}
      />

      <div className="h-layout">

        {/* ── Row 1: Water + WeightStats ── */}
        <div className="h-row-top">
          <WaterCard
            todayMl={todayMl}
            goalMl={goalMl}
            onAdd={handleAddWater}
            onSetGoal={() => setGoalOpen(true)}
          />
          <div className="h-right-col">
            <WeightFormCard onSaved={handleWeightSaved} />
            <WeightStatsCard latest={latest} goalWeight={goalWeight} history={history} />
          </div>
        </div>

        {/* ── Row 2: Chart + History ── */}
        <div className="h-row-bottom">
          <WeightChart history={history} />
          <WeightHistory history={history} onDelete={handleDeleteWeight} />
        </div>

        {/* ── Row 3: Sleep Tracker ── */}
        <SleepSection
          logs={sleepLogs}
          summary={sleepSum}
          onAdd={handleAddSleep}
          onDelete={handleDeleteSleep}
        />

      </div>
    </div>
  )
}
