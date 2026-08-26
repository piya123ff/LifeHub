import React, { useState, useEffect, useMemo } from 'react'
import { Link }             from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { financeService }   from '../../services/financeService.js'
import { todoService }      from '../../services/todoService.js'
import { workoutService }   from '../../services/workoutService.js'
import { goalsService }     from '../../services/goalsService.js'
import { habitService }     from '../../services/habitService.js'
import { healthService }    from '../../services/healthService.js'
import { formatMoney }      from '../../utils/formatMoney.js'
import { percentage }       from '../../utils/calculations.js'
import { getThaiGreeting }  from '../../hooks/useToday.js'
import StatCard             from '../../components/ui/StatCard.jsx'
import ProgressBar          from '../../components/ui/ProgressBar.jsx'
import './DashboardPage.css'

/* ── Helpers ── */
function isRunningAsPWA() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.82rem' }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

/* ── Quick action card ── */
function QuickAction({ to, emoji, label, accent }) {
  return (
    <Link to={to} className={`quick-action quick-action--${accent}`}>
      <span className="quick-action-emoji">{emoji}</span>
      <span className="quick-action-label">{label}</span>
    </Link>
  )
}

/* ── Todo mini row ── */
function TodoMini({ todo, onToggle }) {
  return (
    <div
      className={`todo-mini ${todo.completed ? 'todo-mini--done' : ''}`}
      onClick={() => onToggle(todo.id)}
      role="checkbox" aria-checked={todo.completed} tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle(todo.id)}
    >
      <span className={`todo-mini-check priority-${todo.priority} ${todo.completed ? 'todo-mini-check--done' : ''}`}>
        {todo.completed && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </span>
      <span className="todo-mini-title">{todo.title}</span>
      {todo.priority === 'high' && !todo.completed && (
        <span className="todo-mini-urgent">!</span>
      )}
    </div>
  )
}

/* ── Goal mini ── */
function GoalMini({ goal }) {
  const pct = percentage(goal.progress, goal.target)
  return (
    <div className="goal-mini">
      <div className="goal-mini-header">
        <span className="goal-mini-emoji">{goal.emoji || '🎯'}</span>
        <div className="goal-mini-info">
          <span className="goal-mini-title">{goal.title}</span>
          <span className="goal-mini-nums">
            {goal.progress.toLocaleString('th-TH')} / {goal.target.toLocaleString('th-TH')} {goal.unit}
          </span>
        </div>
        <span className="goal-mini-pct">{pct}%</span>
      </div>
      <ProgressBar value={goal.progress} total={goal.target} color="violet" height={5}/>
    </div>
  )
}

/* ── Habit check row ── */
function HabitMiniRow({ habit, checked, onToggle }) {
  return (
    <div
      className={`habit-mini ${checked ? 'habit-mini--done' : ''}`}
      onClick={() => onToggle(habit.id)}
      role="checkbox" aria-checked={checked} tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle(habit.id)}
    >
      <span className="habit-mini-emoji">{habit.emoji || '⭐'}</span>
      <span className="habit-mini-title">{habit.title}</span>
      <span className={`habit-mini-check ${checked ? 'habit-mini-check--done' : ''}`}>
        {checked
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          : null}
      </span>
    </div>
  )
}

/* ── Icon helpers ── */
const Icon = {
  trendUp:  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDn:  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  wallet:   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  check:    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  dumbbell: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11M4 10.5h2M18 10.5h2M4 13.5h2M18 13.5h2"/><rect x="2" y="9" width="2" height="6" rx="1"/><rect x="20" y="9" width="2" height="6" rx="1"/><rect x="6" y="5" width="2" height="14" rx="1"/><rect x="16" y="5" width="2" height="14" rx="1"/></svg>,
  bolt:     <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  drop:     <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
}

/* ═══════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const [finance,     setFinance]     = useState({ income: 0, expense: 0, balance: 0 })
  const [todos,       setTodos]       = useState([])
  const [todoCounts,  setTodoCounts]  = useState({ pending: 0, total: 0, completed: 0, dueToday: 0 })
  const [workout,     setWorkout]     = useState({ sessions: 0, totalMinutes: 0, calories: 0 })
  const [goals,       setGoals]       = useState([])
  const [chartData,   setChartData]   = useState([])
  const [habits,      setHabits]      = useState([])
  const [habitLogs,   setHabitLogs]   = useState({})
  const [habitSum,    setHabitSum]    = useState({ total: 0, doneToday: 0 })
  const [waterToday,  setWaterToday]  = useState(0)
  const [pwaHint,     setPwaHint]     = useState(() => !isRunningAsPWA())

  function loadAll() {
    setFinance(financeService.getMonthlySummary())
    const allTodos = todoService.getAll()
    const pendingTodos = allTodos.filter(t => !t.completed).slice(0, 5)
    setTodos(pendingTodos)
    setTodoCounts(todoService.getSummary())
    setWorkout(workoutService.getWeeklySummary())
    setGoals(goalsService.getAll().slice(0, 3))
    setChartData(financeService.getMonthlyChart(6))
    const allHabits = habitService.getAll()
    setHabits(allHabits.slice(0, 5))
    setHabitSum(habitService.getSummary())
    const today = new Date().toISOString().slice(0, 10)
    const logs = {}
    allHabits.forEach(h => { logs[h.id] = habitService.isChecked(h.id, today) })
    setHabitLogs(logs)
    const hs = healthService.getTodayStats ? healthService.getTodayStats() : null
    if (hs) setWaterToday(hs.waterMl || 0)
  }

  useEffect(() => { loadAll() }, [])

  function handleToggleTodo(id) {
    todoService.toggle(id)
    loadAll()
  }

  function handleToggleHabit(id) {
    const today = new Date().toISOString().slice(0, 10)
    habitService.toggle(id, today)
    loadAll()
  }

  const statCards = [
    { title: 'รายรับเดือนนี้',    value: formatMoney(finance.income),   sub: 'Income',  accent: 'green',  icon: Icon.trendUp  },
    { title: 'รายจ่ายเดือนนี้',   value: formatMoney(finance.expense),  sub: 'Expense', accent: 'rose',   icon: Icon.trendDn  },
    { title: 'คงเหลือ',           value: formatMoney(finance.balance),  sub: finance.balance >= 0 ? '✓ บวก' : '⚠ ติดลบ', accent: finance.balance >= 0 ? 'violet' : 'amber', icon: Icon.wallet },
    { title: 'งานสำเร็จ',         value: `${todoCounts.completed}/${todoCounts.total}`, sub: `รออีก ${todoCounts.pending}`, accent: 'blue', icon: Icon.check },
    { title: 'Workout สัปดาห์นี้', value: `${workout.sessions} ครั้ง`,  sub: `${workout.totalMinutes} นาที`, accent: 'orange', icon: Icon.dumbbell },
    { title: 'แคลอรี่',           value: `${workout.calories.toLocaleString('th-TH')}`, sub: 'cal / สัปดาห์', accent: 'teal', icon: Icon.bolt },
  ]

  const hasChartData = chartData.some(d => d.income || d.expense)
  const habitPct = habitSum.total > 0 ? Math.round((habitSum.doneToday / habitSum.total) * 100) : 0

  const quickActions = [
    { to: '/finance',  emoji: '💸', label: 'บันทึกรายจ่าย', accent: 'rose'   },
    { to: '/todo',     emoji: '✅', label: 'เพิ่มงาน',       accent: 'blue'   },
    { to: '/workout',  emoji: '🏋️', label: 'เริ่ม Workout',  accent: 'orange' },
    { to: '/health',   emoji: '💧', label: 'บันทึกน้ำ',      accent: 'teal'   },
  ]

  const dateStr = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  return (
    <div className="dashboard page">

      {/* ══ GREETING HERO ══ */}
      <div className="dash-hero animate-fadeup">
        <div className="dash-hero-left">
          <h1 className="dash-greeting">{getThaiGreeting()}</h1>
          <p className="dash-date">{dateStr}</p>
        </div>
        <div className="dash-hero-right">
          {todoCounts.dueToday > 0 && (
            <Link to="/todo" className="dash-due-badge">
              <span className="dash-due-dot"/>
              {todoCounts.dueToday} งานวันนี้
            </Link>
          )}
          {habitSum.total > 0 && (
            <div className="dash-habit-ring-wrap">
              <svg className="dash-habit-ring" viewBox="0 0 36 36" width="52" height="52">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke="url(#rg)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${habitPct * 0.974} 97.4`}
                  transform="rotate(-90 18 18)"/>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c63ff"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="dash-habit-ring-pct">{habitPct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ══ QUICK ACTIONS ══ */}
      <div className="dash-section">
        <div className="section-header">
          <span className="section-label">Quick Actions</span>
        </div>
        <div className="quick-actions-row">
          {quickActions.map(a => <QuickAction key={a.to} {...a}/>)}
        </div>
      </div>

      {/* ══ HABIT CHECK-IN ══ */}
      {habits.length > 0 && (
        <div className="dash-section animate-fadeup" style={{ animationDelay: '60ms' }}>
          <div className="section-header">
            <span className="section-title">🔁 Habits วันนี้</span>
            <div className="dash-habit-progress-text">
              {habitSum.doneToday}/{habitSum.total}
              {habitPct === 100 && <span className="dash-habit-done-badge">🎉 ครบ!</span>}
            </div>
          </div>
          <div className="card card-pad-md dash-habits-card">
            <div className="progress-track" style={{ height: 4, marginBottom: 12 }}>
              <div className="progress-fill fill-violet" style={{ width: `${habitPct}%`, height: '100%' }}/>
            </div>
            <div className="dash-habit-list">
              {habits.map(h => (
                <HabitMiniRow
                  key={h.id} habit={h}
                  checked={!!habitLogs[h.id]}
                  onToggle={handleToggleHabit}
                />
              ))}
            </div>
            {habitSum.total > 5 && (
              <Link to="/habits" className="section-action" style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                ดูทั้งหมด →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══ STAT CARDS ══ */}
      <div className="dash-section animate-fadeup" style={{ animationDelay: '90ms' }}>
        <div className="section-header">
          <span className="section-title">📊 ภาพรวมเดือนนี้</span>
          <Link to="/finance" className="section-action">Finance →</Link>
        </div>
        <div className="stat-cards stagger">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} style={{ animationDelay: `${i * 40}ms` }}/>
          ))}
        </div>
      </div>

      {/* ══ CHART + TODO ══ */}
      <div className="dashboard-cols animate-fadeup" style={{ animationDelay: '120ms' }}>

        {/* Finance chart */}
        <div className="card card-pad-md">
          <div className="section-header">
            <span className="section-title">📈 รายรับ-รายจ่าย 6 เดือน</span>
            <Link to="/finance" className="section-action">ดูทั้งหมด →</Link>
          </div>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: '#4a4a68', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#4a4a68', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `฿${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="income"  name="รายรับ"  stroke="#4ade80" fill="url(#gi)" strokeWidth={2}/>
                <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#f43f5e" fill="url(#ge)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <span className="empty-state-icon">📊</span>
              <p className="empty-state-title">ยังไม่มีข้อมูลการเงิน</p>
              <Link to="/finance" className="btn btn-ghost btn-size-sm empty-state-action">เพิ่มรายการ →</Link>
            </div>
          )}
        </div>

        {/* Todo list */}
        <div className="card card-pad-md">
          <div className="section-header">
            <span className="section-title">✅ งานที่รออยู่</span>
            {todoCounts.pending > 0 && (
              <span className="badge badge-violet">{todoCounts.pending} รายการ</span>
            )}
          </div>
          <div className="dash-todo-list">
            {todos.length > 0
              ? todos.map(t => <TodoMini key={t.id} todo={t} onToggle={handleToggleTodo}/>)
              : (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <span className="empty-state-icon">🎉</span>
                  <p className="empty-state-title">งานทำเสร็จหมดแล้ว!</p>
                </div>
              )
            }
          </div>
          <Link to="/todo" className="section-action" style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>ดูทั้งหมด →</Link>
        </div>

      </div>

      {/* ══ GOALS ══ */}
      {goals.length > 0 && (
        <div className="dash-section animate-fadeup" style={{ animationDelay: '150ms' }}>
          <div className="section-header">
            <span className="section-title">🎯 เป้าหมาย</span>
            <Link to="/goals" className="section-action">ดูทั้งหมด →</Link>
          </div>
          <div className="card card-pad-md">
            <div className="goals-mini-grid">
              {goals.map(g => <GoalMini key={g.id} goal={g}/>)}
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="card card-pad-md dash-empty-goals animate-fadeup" style={{ animationDelay: '150ms' }}>
          <span>🎯</span>
          <div>
            <p>ยังไม่มีเป้าหมาย</p>
            <span>ตั้งเป้าหมายและติดตามความคืบหน้า</span>
          </div>
          <Link to="/goals" className="btn btn-primary btn-size-sm">ตั้งเป้าหมาย</Link>
        </div>
      )}

      {/* ══ PWA HINT ══ */}
      {pwaHint && (
        <div className="dash-pwa-hint animate-fadeup" style={{ animationDelay: '300ms' }}>
          <span>📱</span>
          <div>
            <p>เพิ่มไปยัง Home Screen</p>
            <span>Safari → Share → "Add to Home Screen" เพื่อใช้ offline</span>
          </div>
          <button className="btn btn-ghost btn-size-sm" onClick={() => setPwaHint(false)}>รับทราบ</button>
        </div>
      )}

    </div>
  )
}
