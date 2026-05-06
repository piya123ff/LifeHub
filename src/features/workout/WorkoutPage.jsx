import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { workoutService } from '../../services/workoutService.js'
import {
  buildWeekChart, calcStreak, formatDateTH, formatTime,
  workedOutToday,
} from './workoutUtils.js'
import './WorkoutPage.css'

/* ─────────────────────────── constants ─────────────────────────── */
const EMPTY_EX = {
  name: '', reps: '12', sets: '3',
  restBetweenSetsMinutes: '1', restBetweenExercisesMinutes: '2',
}

const REST_PRESETS = [
  { label: '30วิ', secs: 30 },
  { label: '1นาที', secs: 60 },
  { label: '1:30', secs: 90 },
  { label: '2นาที', secs: 120 },
  { label: '3นาที', secs: 180 },
]

const COOLDOWN_OPTS = [10, 15, 20, 30]

/* ─────────────────────────── Toast ──────────────────────────────── */
function Toast({ flash }) {
  if (!flash) return null
  return <div className={`wo-toast wo-toast--${flash.type}`}>{flash.msg}</div>
}

/* ─────────────────────────── WorkoutTimer ───────────────────────── */
function WorkoutTimer({ elapsed, running, sessionStarted, onStart, onPause, onReset }) {
  return (
    <div className="card card-pad-lg wv2-timer-card">
      <p className="wv2-card-title">
        <span className="wv2-card-icon">⏱</span> Workout Timer
      </p>
      <div className="wv2-clock">{formatTime(elapsed)}</div>
      <div className="wv2-btn-row">
        {!sessionStarted ? (
          <button className="btn btn-primary wv2-btn-main" onClick={onStart}>
            ▶ เริ่ม Workout
          </button>
        ) : running ? (
          <button className="btn btn-ghost wv2-btn-main" onClick={onPause}>
            ⏸ หยุดชั่วคราว
          </button>
        ) : (
          <button className="btn btn-primary wv2-btn-main" onClick={onStart}>
            ▶ ดำเนินต่อ
          </button>
        )}
        {sessionStarted && (
          <button className="btn btn-ghost wv2-btn-aux" onClick={onReset}>
            ↺ รีเซ็ต
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── ExerciseForm ───────────────────────── */
function ExerciseForm({ form, onChange, onAdd, editing, onCancelEdit }) {
  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd()
  }
  return (
    <div className="card card-pad-lg">
      <p className="wv2-card-title">
        <span className="wv2-card-icon">{editing ? '✏️' : '➕'}</span>
        {editing ? 'แก้ไขท่า' : 'เพิ่มท่าออกกำลังกาย'}
      </p>
      <form onSubmit={submit} className="wv2-ex-form">
        <div className="field">
          <label className="field-label">ชื่อท่า</label>
          <input
            className="input"
            placeholder="เช่น Push-up, Squat, Plank..."
            value={form.name}
            onChange={e => onChange('name', e.target.value)}
          />
        </div>
        <div className="wv2-form-row">
          <div className="field">
            <label className="field-label">ครั้ง / เซ็ต</label>
            <input className="input" type="number" inputMode="numeric"
              min="1" max="999" value={form.reps}
              onChange={e => onChange('reps', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">จำนวนเซ็ต</label>
            <input className="input" type="number" inputMode="numeric"
              min="1" max="99" value={form.sets}
              onChange={e => onChange('sets', e.target.value)} />
          </div>
        </div>
        <div className="wv2-form-row">
          <div className="field">
            <label className="field-label">พักเซ็ต (นาที)</label>
            <input className="input" type="number" inputMode="decimal"
              min="0" step="0.5" max="30"
              value={form.restBetweenSetsMinutes}
              onChange={e => onChange('restBetweenSetsMinutes', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">พักท่า (นาที)</label>
            <input className="input" type="number" inputMode="decimal"
              min="0" step="0.5" max="30"
              value={form.restBetweenExercisesMinutes}
              onChange={e => onChange('restBetweenExercisesMinutes', e.target.value)} />
          </div>
        </div>
        <div className="wv2-btn-row">
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            {editing ? '✅ บันทึกการแก้ไข' : '➕ เพิ่มท่า'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost wv2-btn-aux" onClick={onCancelEdit}>
              ยกเลิก
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

/* ─────────────────────────── RestTimer ──────────────────────────── */
function RestTimer({ restSecs, restRunning, restDone, onStart, onPause, onReset, exercises }) {
  const activeEx = exercises.find(e => !e.isCompleted)
  return (
    <div className="card card-pad-lg">
      <p className="wv2-card-title">
        <span className="wv2-card-icon">⏸</span> Rest Timer
      </p>

      {/* Quick presets */}
      <div className="wv2-presets">
        {REST_PRESETS.map(p => (
          <button key={p.secs} className="quick-btn" onClick={() => onStart(p.secs)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Context-aware buttons from active exercise */}
      {activeEx && (
        <div className="wv2-rest-ctx">
          <button className="btn btn-ghost wv2-btn-ctx"
            onClick={() => onStart(Math.round(Number(activeEx.restBetweenSetsMinutes) * 60))}>
            พักเซ็ต ({activeEx.restBetweenSetsMinutes}′)
          </button>
          <button className="btn btn-ghost wv2-btn-ctx"
            onClick={() => onStart(Math.round(Number(activeEx.restBetweenExercisesMinutes) * 60))}>
            พักท่า ({activeEx.restBetweenExercisesMinutes}′)
          </button>
        </div>
      )}

      {/* Countdown display */}
      {(restSecs > 0 || restDone) && (
        <div className={`wv2-rest-panel${restDone ? ' wv2-rest-panel--done' : ''}`}>
          <div className="wv2-rest-clock">{formatTime(restSecs)}</div>
          {restDone ? (
            <p className="wv2-rest-done">✅ พักครบแล้ว พร้อมทำต่อ!</p>
          ) : (
            <div className="wv2-btn-row">
              {restRunning
                ? <button className="btn btn-ghost wv2-btn-aux" onClick={onPause}>⏸ หยุด</button>
                : <button className="btn btn-primary wv2-btn-aux" onClick={() => onStart(restSecs)}>▶ ต่อ</button>
              }
              <button className="btn btn-ghost wv2-btn-aux" onClick={onReset}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── CooldownTimer ─────────────────────── */
function CooldownTimer({ visible, cooldownSecs, cooldownRunning, cooldownDone,
                         cooldownMins, onSetMins, onStart, onPause, onReset }) {
  if (!visible) return null
  return (
    <div className="card card-pad-lg wv2-cooldown-card">
      <p className="wv2-card-title">
        <span className="wv2-card-icon">🚿</span> เวลาพักก่อนอาบน้ำ
      </p>
      <div className="wv2-presets">
        {COOLDOWN_OPTS.map(m => (
          <button key={m}
            className={`quick-btn${cooldownMins === m ? ' quick-btn--active' : ''}`}
            onClick={() => onSetMins(m)}>
            {m}′
          </button>
        ))}
      </div>
      {cooldownDone ? (
        <div className="wv2-shower-ready">🚿 พร้อมอาบน้ำได้แล้ว!</div>
      ) : (
        <>
          <div className="wv2-clock wv2-clock--cool">
            {formatTime(cooldownSecs > 0 ? cooldownSecs : cooldownMins * 60)}
          </div>
          <div className="wv2-btn-row">
            {cooldownRunning
              ? <button className="btn btn-ghost wv2-btn-main" onClick={onPause}>⏸ หยุดชั่วคราว</button>
              : <button className="btn btn-primary wv2-btn-main" onClick={onStart}>▶ เริ่มพัก {cooldownMins} นาที</button>
            }
            {(cooldownRunning || cooldownSecs > 0) && (
              <button className="btn btn-ghost wv2-btn-aux" onClick={onReset}>↺</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────── ExerciseList ───────────────────────── */
function ExerciseList({ exercises, sessionStarted, onCompleteSet, onToggleDone, onEdit, onDelete, onFinish }) {
  const totalSets = exercises.reduce((s, e) => s + Number(e.sets), 0)
  const doneSets  = exercises.reduce((s, e) => s + Number(e.completedSets), 0)
  const doneExs   = exercises.filter(e => e.isCompleted).length
  const pct       = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  return (
    <div className="card card-pad-lg">
      <div className="wv2-list-head">
        <p className="wv2-card-title" style={{ margin: 0 }}>
          <span className="wv2-card-icon">🏋️</span> แผนการออกกำลังกาย
        </p>
        {exercises.length > 0 && (
          <span className="wv2-badge">{doneExs}/{exercises.length} ท่า</span>
        )}
      </div>

      {exercises.length > 0 && (
        <div className="wv2-progress-wrap">
          <div className="wv2-progress-track">
            <div className="wv2-progress-fill" style={{ width: pct + '%' }} />
          </div>
          <div className="wv2-progress-meta">
            <span>เซ็ต {doneSets}/{totalSets}</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="wo-empty">
          <span>📝</span>
          <p>ยังไม่มีท่า — เพิ่มท่าออกกำลังกายด้านซ้าย</p>
        </div>
      ) : (
        <div className="wv2-ex-list">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className={`wv2-ex-item${ex.isCompleted ? ' wv2-ex-item--done' : ''}`}>
              <div className="wv2-ex-num">{idx + 1}</div>
              <div className="wv2-ex-body">
                <div className="wv2-ex-name">
                  {ex.isCompleted && <span className="wv2-check">✅</span>}
                  {ex.name}
                </div>
                <div className="wv2-ex-detail">
                  {ex.reps} ครั้ง × {ex.sets} เซ็ต
                  <span className="wv2-dot">·</span>
                  พักเซ็ต {ex.restBetweenSetsMinutes}′
                  <span className="wv2-dot">·</span>
                  พักท่า {ex.restBetweenExercisesMinutes}′
                </div>
                {sessionStarted && (
                  <div className="wv2-set-row">
                    {Array.from({ length: Number(ex.sets) }).map((_, i) => (
                      <button
                        key={i}
                        className={`wv2-set-dot${i < ex.completedSets ? ' wv2-set-dot--on' : ''}`}
                        onClick={() => onCompleteSet(ex.id, i)}
                        aria-label={`เซ็ต ${i + 1}`}
                      />
                    ))}
                    <span className="wv2-set-label">{ex.completedSets}/{ex.sets}</span>
                  </div>
                )}
              </div>
              <div className="wv2-ex-ctrls">
                {sessionStarted && !ex.isCompleted && (
                  <button className="wv2-ctrl-tick" onClick={() => onToggleDone(ex.id)} title="เสร็จแล้ว">✓</button>
                )}
                {!sessionStarted && (
                  <>
                    <button className="wv2-ctrl-edit" onClick={() => onEdit(ex.id)} title="แก้ไข">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button className="wv2-ctrl-del" onClick={() => onDelete(ex.id)} title="ลบ">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessionStarted && exercises.length > 0 && (
        <button className="btn btn-primary wv2-finish-btn" onClick={onFinish}>
          🏁 จบ Workout
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────── V2 History row ─────────────────────── */
function V2HistoryRow({ s, onDelete, confirmId, onConfirmDelete }) {
  const mins = Math.floor(s.durationSeconds / 60)
  const secs = s.durationSeconds % 60
  const names = s.exercises.map(e => e.name).join(', ')
  return (
    <div className="session-row">
      <div className="session-emoji">💪</div>
      <div className="session-info">
        <span className="session-type" title={names}>{names.slice(0, 38) || 'Workout'}</span>
        <span className="session-note">
          {s.completedSets}/{s.totalSets} เซ็ต · {s.exercises.length} ท่า
          {s.isCompleted && ' · ✅'}
        </span>
        <span className="session-date">{formatDateTH(s.date)}</span>
      </div>
      <div className="session-stats">
        <span className="session-min">{mins}:{String(secs).padStart(2, '0')}</span>
      </div>
      <button
        className={`session-del wv2-del-vis${confirmId === s.id ? ' session-del--confirm' : ''}`}
        onClick={() => onConfirmDelete(s.id)}
        title={confirmId === s.id ? 'ยืนยันการลบ' : 'ลบ'}
      >
        {confirmId === s.id
          ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        }
      </button>
    </div>
  )
}

/* ─────────────────────────── StreakBadge ────────────────────────── */
function StreakBadge({ streak, doneToday }) {
  return (
    <div className={`streak-card${doneToday ? ' streak-card--active' : ''}`}>
      <div className="streak-flame">{doneToday ? '🔥' : '💤'}</div>
      <div className="streak-info">
        <p className="streak-num">{streak}</p>
        <p className="streak-label">วัน streak</p>
      </div>
      <div className="streak-status">
        {doneToday
          ? <span className="badge-done">✅ ออกกำลังกายแล้ววันนี้</span>
          : <span className="badge-miss">ยังไม่ได้ออกวันนี้</span>}
      </div>
    </div>
  )
}

/* ─────────────────────────── WeekSummary ────────────────────────── */
function WeekSummary({ sessions }) {
  const weekAgo = new Date(Date.now() - 7 * 864e5)
  const week    = sessions.filter(s => new Date(s.date) >= weekAgo)
  const mins    = week.reduce((s, w) => s + (w.duration  || 0), 0)
  const cals    = week.reduce((s, w) => s + (w.calories  || 0), 0)
  return (
    <div className="week-summary">
      {[
        { label: 'ครั้ง/สัปดาห์', value: week.length                       },
        { label: 'นาที',           value: mins                                },
        { label: 'แคลอรี่',       value: cals.toLocaleString('th-TH') + ' cal' },
      ].map(c => (
        <div key={c.label} className="week-stat">
          <p className="week-stat-val">{c.value}</p>
          <p className="week-stat-label">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────── WeekChart ─────────────────────────── */
function WeekChart({ data }) {
  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '4px 0 0', color: 'var(--accent-orange)', fontSize: '0.82rem' }}>
          {payload[0]?.value} นาที
        </p>
      </div>
    )
  }
  return (
    <div className="week-chart-wrap">
      <p className="section-label" style={{ marginBottom: 12 }}>กิจกรรม 7 วัน</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
          <XAxis dataKey="day" tick={{ fill: '#5a5a7a', fontSize: 12 }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false}/>
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isToday ? 'var(--accent-orange)' : 'rgba(251,146,60,0.35)'}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function WorkoutPage() {
  // ── Legacy sessions (streak + week chart) ──────────────────────
  const [sessions,  setSessions]  = useState(() => workoutService.getAll())
  const [v2history, setV2history] = useState(() => workoutService.getV2Sessions())
  const streak    = useMemo(() => calcStreak(sessions),    [sessions])
  const doneToday = useMemo(() => workedOutToday(sessions), [sessions])
  const chartData = useMemo(() => buildWeekChart(sessions), [sessions])

  // ── Flash toast ─────────────────────────────────────────────────
  const [flash, setFlash] = useState(null)
  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 2500)
  }

  // ── Exercise plan ────────────────────────────────────────────────
  const [exercises, setExercises] = useState([])
  const [exForm,    setExForm]    = useState(EMPTY_EX)
  const [editingId, setEditingId] = useState(null)

  function exField(k, v) { setExForm(f => ({ ...f, [k]: v })) }

  function handleAddEx() {
    if (!exForm.name.trim()) return
    if (editingId) {
      setExercises(list => list.map(e => e.id !== editingId ? e : {
        ...e,
        name: exForm.name.trim(),
        reps: Number(exForm.reps) || 12,
        sets: Number(exForm.sets) || 3,
        restBetweenSetsMinutes: Number(exForm.restBetweenSetsMinutes) || 1,
        restBetweenExercisesMinutes: Number(exForm.restBetweenExercisesMinutes) || 2,
      }))
      setEditingId(null)
    } else {
      setExercises(list => [...list, {
        id: `ex_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        name: exForm.name.trim(),
        reps: Number(exForm.reps) || 12,
        sets: Number(exForm.sets) || 3,
        restBetweenSetsMinutes: Number(exForm.restBetweenSetsMinutes) || 1,
        restBetweenExercisesMinutes: Number(exForm.restBetweenExercisesMinutes) || 2,
        completedSets: 0,
        isCompleted: false,
      }])
    }
    setExForm(EMPTY_EX)
  }

  function handleEditEx(id) {
    const ex = exercises.find(e => e.id === id)
    if (!ex) return
    setExForm({
      name: ex.name,
      reps: String(ex.reps),
      sets: String(ex.sets),
      restBetweenSetsMinutes: String(ex.restBetweenSetsMinutes),
      restBetweenExercisesMinutes: String(ex.restBetweenExercisesMinutes),
    })
    setEditingId(id)
  }

  function handleDeleteEx(id) {
    setExercises(list => list.filter(e => e.id !== id))
    if (editingId === id) { setEditingId(null); setExForm(EMPTY_EX) }
  }

  function handleCompleteSet(id, setIdx) {
    setExercises(list => list.map(e => {
      if (e.id !== id) return e
      const completed = Math.max(e.completedSets, setIdx + 1)
      return { ...e, completedSets: completed, isCompleted: completed >= e.sets }
    }))
  }

  function handleToggleDone(id) {
    setExercises(list => list.map(e => {
      if (e.id !== id) return e
      const isDone = !e.isCompleted
      return { ...e, isCompleted: isDone, completedSets: isDone ? e.sets : e.completedSets }
    }))
  }

  // ── Workout timer ────────────────────────────────────────────────
  const timerRef     = useRef(null)
  const startAtRef   = useRef(null)
  const [elapsed,        setElapsed]        = useState(0)
  const [timerRunning,   setTimerRunning]   = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)

  function startWorkout() {
    if (!startAtRef.current) startAtRef.current = new Date().toISOString()
    if (timerRef.current) return
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    setTimerRunning(true)
    setSessionStarted(true)
  }
  function pauseWorkout() {
    clearInterval(timerRef.current); timerRef.current = null
    setTimerRunning(false)
  }
  function resetWorkout() {
    clearInterval(timerRef.current); timerRef.current = null
    setElapsed(0); setTimerRunning(false); setSessionStarted(false)
    startAtRef.current = null
  }

  // ── Rest timer ───────────────────────────────────────────────────
  const restRef  = useRef(null)
  const [restSecs,    setRestSecs]    = useState(0)
  const [restRunning, setRestRunning] = useState(false)
  const [restDone,    setRestDone]    = useState(false)

  function startRest(secs) {
    clearInterval(restRef.current); setRestDone(false); setRestSecs(secs)
    restRef.current = setInterval(() => {
      setRestSecs(s => {
        if (s <= 1) {
          clearInterval(restRef.current); restRef.current = null
          setRestRunning(false); setRestDone(true); return 0
        }
        return s - 1
      })
    }, 1000)
    setRestRunning(true)
  }
  function pauseRest() {
    clearInterval(restRef.current); restRef.current = null; setRestRunning(false)
  }
  function resetRest() {
    clearInterval(restRef.current); restRef.current = null
    setRestSecs(0); setRestRunning(false); setRestDone(false)
  }

  // ── Cooldown timer ───────────────────────────────────────────────
  const coolRef  = useRef(null)
  const [cooldownMins,    setCooldownMins]    = useState(() => workoutService.getCooldownPref())
  const [cooldownSecs,    setCooldownSecs]    = useState(0)
  const [cooldownRunning, setCooldownRunning] = useState(false)
  const [cooldownDone,    setCooldownDone]    = useState(false)
  const [showCooldown,    setShowCooldown]    = useState(false)

  function setCooldownPreset(m) {
    setCooldownMins(m); workoutService.setCooldownPref(m)
    clearInterval(coolRef.current); coolRef.current = null
    setCooldownSecs(0); setCooldownRunning(false); setCooldownDone(false)
  }
  function startCooldown() {
    const start = cooldownSecs > 0 ? cooldownSecs : cooldownMins * 60
    clearInterval(coolRef.current); setCooldownDone(false); setCooldownSecs(start)
    coolRef.current = setInterval(() => {
      setCooldownSecs(s => {
        if (s <= 1) {
          clearInterval(coolRef.current); coolRef.current = null
          setCooldownRunning(false); setCooldownDone(true); return 0
        }
        return s - 1
      })
    }, 1000)
    setCooldownRunning(true)
  }
  function pauseCooldown() {
    clearInterval(coolRef.current); coolRef.current = null; setCooldownRunning(false)
  }
  function resetCooldown() {
    clearInterval(coolRef.current); coolRef.current = null
    setCooldownSecs(0); setCooldownRunning(false); setCooldownDone(false)
  }

  // Cleanup all intervals on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearInterval(restRef.current)
    clearInterval(coolRef.current)
  }, [])

  // ── Finish workout ───────────────────────────────────────────────
  function handleFinishWorkout() {
    if (elapsed < 5) { showFlash('ยังไม่ได้เริ่ม Workout', 'warn'); return }
    pauseWorkout()
    const totalSets     = exercises.reduce((s, e) => s + Number(e.sets),          0)
    const completedSets = exercises.reduce((s, e) => s + Number(e.completedSets), 0)
    const isCompleted   = exercises.length > 0 && exercises.every(e => e.isCompleted)
    const endedAt       = new Date().toISOString()

    workoutService.addV2Session({
      date: endedAt, startedAt: startAtRef.current || endedAt, endedAt,
      durationSeconds: elapsed,
      exercises: exercises.map(e => ({ ...e })),
      totalSets, completedSets, isCompleted,
      showerCooldownMinutes: cooldownMins,
    })
    setV2history(workoutService.getV2Sessions())

    // Save to legacy sessions for streak + week chart
    workoutService.add({
      type:     'weights',
      duration: Math.max(1, Math.round(elapsed / 60)),
      calories: Math.round(elapsed / 60 * 5),
      note:     exercises.map(e => e.name).join(', ').slice(0, 80) || null,
      date:     endedAt,
    })
    setSessions(workoutService.getAll())

    resetWorkout()
    setExercises([])
    setShowCooldown(true)
    resetCooldown()
    showFlash('💪 บันทึก Workout เรียบร้อย!')
  }

  // ── V2 delete (with confirm) ─────────────────────────────────────
  const [confirmId, setConfirmId] = useState(null)
  function handleConfirmDelete(id) {
    if (confirmId === id) {
      workoutService.deleteV2Session(id)
      setV2history(workoutService.getV2Sessions())
      setConfirmId(null)
      showFlash('ลบรายการแล้ว', 'warn')
    } else {
      setConfirmId(id)
      setTimeout(() => setConfirmId(null), 3000)
    }
  }

  /* ─────────────── RENDER ──────────────────────────────────────── */
  return (
    <div className="wo-page">
      <Toast flash={flash} />

      <div className="wv2-layout">

        {/* ═════════ LEFT ═════════ */}
        <aside className="wv2-left">
          <StreakBadge streak={streak} doneToday={doneToday} />

          <WorkoutTimer
            elapsed={elapsed} running={timerRunning} sessionStarted={sessionStarted}
            onStart={startWorkout} onPause={pauseWorkout} onReset={resetWorkout}
          />

          <ExerciseForm
            form={exForm} onChange={exField} onAdd={handleAddEx}
            editing={!!editingId}
            onCancelEdit={() => { setEditingId(null); setExForm(EMPTY_EX) }}
          />

          <RestTimer
            restSecs={restSecs} restRunning={restRunning} restDone={restDone}
            onStart={startRest} onPause={pauseRest} onReset={resetRest}
            exercises={exercises}
          />

          <CooldownTimer
            visible={showCooldown}
            cooldownSecs={cooldownSecs} cooldownRunning={cooldownRunning}
            cooldownDone={cooldownDone} cooldownMins={cooldownMins}
            onSetMins={setCooldownPreset} onStart={startCooldown}
            onPause={pauseCooldown} onReset={resetCooldown}
          />
        </aside>

        {/* ═════════ RIGHT ═════════ */}
        <section className="wv2-right">

          <ExerciseList
            exercises={exercises}
            sessionStarted={sessionStarted}
            onCompleteSet={handleCompleteSet}
            onToggleDone={handleToggleDone}
            onEdit={handleEditEx}
            onDelete={handleDeleteEx}
            onFinish={handleFinishWorkout}
          />

          {/* Week stats + chart */}
          <div className="card card-pad-lg">
            <p className="section-label" style={{ marginBottom: 16 }}>สรุปสัปดาห์นี้</p>
            <WeekSummary sessions={sessions} />
            <div style={{ marginTop: 24 }}>
              <WeekChart data={chartData} />
            </div>
          </div>

          {/* V2 Session history */}
          <div className="card card-pad-lg">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <p className="section-label">ประวัติ Workout</p>
              <span className="badge">{v2history.length} ครั้ง</span>
            </div>
            {v2history.length === 0 ? (
              <div className="wo-empty">
                <span>💪</span>
                <p>ยังไม่มีประวัติ — เริ่ม workout แรกได้เลย!</p>
              </div>
            ) : (
              <div className="session-list">
                {v2history.slice(0, 25).map(s => (
                  <V2HistoryRow
                    key={s.id} s={s}
                    confirmId={confirmId}
                    onConfirmDelete={handleConfirmDelete}
                  />
                ))}
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  )
}
