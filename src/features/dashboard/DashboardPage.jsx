import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { financeService }  from '../../services/financeService.js'
import { todoService }     from '../../services/todoService.js'
import { workoutService }  from '../../services/workoutService.js'
import { goalsService }    from '../../services/goalsService.js'
import { formatMoney }     from '../../utils/formatMoney.js'
import { percentage }      from '../../utils/calculations.js'
import { getThaiGreeting } from '../../hooks/useToday.js'
import StatCard            from '../../components/ui/StatCard.jsx'
import ProgressBar         from '../../components/ui/ProgressBar.jsx'
import './DashboardPage.css'

/* ── Chart tooltip ──────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '0.85rem' }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

/* ── Todo mini row ──────────────────────────────────────── */
function TodoMini({ todo, onToggle }) {
  return (
    <div
      className={`todo-mini ${todo.completed ? 'todo-mini--done' : ''}`}
      onClick={() => onToggle(todo.id)}
      role="checkbox"
      aria-checked={todo.completed}
      tabIndex={0}
      onKeyDown={e => e.key === ' ' && onToggle(todo.id)}
    >
      <span className={`todo-mini-check priority-${todo.priority} ${todo.completed ? 'todo-mini-check--done' : ''}`}>
        {todo.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </span>
      <span className="todo-mini-title">{todo.title}</span>
      {todo.priority === 'high' && !todo.completed && (
        <span className="todo-mini-badge">!</span>
      )}
    </div>
  )
}

/* ── Goal mini card ─────────────────────────────────────── */
function GoalMini({ goal }) {
  const pct = percentage(goal.progress, goal.target)
  return (
    <div className="goal-mini">
      <div className="goal-mini-header">
        <span className="goal-mini-emoji">{goal.emoji || '🎯'}</span>
        <div className="goal-mini-info">
          <span className="goal-mini-title">{goal.title}</span>
          <span className="goal-mini-nums">
            <span>{goal.progress.toLocaleString('th-TH')}</span>
            <span className="text-muted">/ {goal.target.toLocaleString('th-TH')} {goal.unit}</span>
          </span>
        </div>
        <span className="goal-mini-pct">{pct}%</span>
      </div>
      <ProgressBar value={goal.progress} total={goal.target} color="violet" height={6}/>
    </div>
  )
}

/* ── Icon helpers ───────────────────────────────────────── */
const Icon = {
  trendUp:  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDn:  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  wallet:   <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  check:    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  dumbbell: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 6.5h11M4 10.5h2M18 10.5h2M4 13.5h2M18 13.5h2"/><rect x="2" y="9" width="2" height="6" rx="1"/><rect x="20" y="9" width="2" height="6" rx="1"/><rect x="6" y="5" width="2" height="14" rx="1"/><rect x="16" y="5" width="2" height="14" rx="1"/></svg>,
  bolt:     <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
}

/* ── isPWA helper ───────────────────────────────────────── */
function isRunningAsPWA() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

/* ══════════════════════════════════════════════════════════
   Dashboard Page
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [finance,    setFinance]    = useState({ income: 0, expense: 0, balance: 0 })
  const [todos,      setTodos]      = useState([])
  const [todoCounts, setTodoCounts] = useState({ pending: 0, total: 0, completed: 0, dueToday: 0 })
  const [workout,    setWorkout]    = useState({ sessions: 0, totalMinutes: 0, calories: 0 })
  const [goals,      setGoals]      = useState([])
  const [chartData,  setChartData]  = useState([])
  const [pwaHint,    setPwaHint]    = useState(() => !isRunningAsPWA())

  function loadAll() {
    setFinance(financeService.getMonthlySummary())
    setTodos(todoService.getAll().slice(0, 6))
    setTodoCounts(todoService.getSummary())
    setWorkout(workoutService.getWeeklySummary())
    setGoals(goalsService.getAll().slice(0, 3))
    setChartData(financeService.getMonthlyChart(6))
  }

  useEffect(() => { loadAll() }, [])

  function handleToggle(id) {
    todoService.toggle(id)
    setTodos(todoService.getAll().slice(0, 6))
    setTodoCounts(todoService.getSummary())
  }

  const statCards = [
    { title: 'รายรับเดือนนี้',    value: formatMoney(finance.income),   sub: 'รายรับทั้งหมด',         accent: 'green',  icon: Icon.trendUp  },
    { title: 'รายจ่ายเดือนนี้',   value: formatMoney(finance.expense),  sub: 'รายจ่ายทั้งหมด',        accent: 'rose',   icon: Icon.trendDn  },
    { title: 'คงเหลือ',           value: formatMoney(finance.balance),  sub: finance.balance >= 0 ? '✓ บวก' : '⚠ ติดลบ', accent: finance.balance >= 0 ? 'violet' : 'amber', icon: Icon.wallet },
    { title: 'งานสำเร็จ',         value: `${todoCounts.completed} / ${todoCounts.total}`, sub: `รออีก ${todoCounts.pending} รายการ`, accent: 'blue', icon: Icon.check },
    { title: 'Workout สัปดาห์นี้', value: `${workout.sessions} ครั้ง`,  sub: `${workout.totalMinutes} นาที`, accent: 'orange', icon: Icon.dumbbell },
    { title: 'เผาผลาญ',           value: `${workout.calories.toLocaleString('th-TH')} cal`, sub: 'สัปดาห์นี้', accent: 'teal', icon: Icon.bolt },
  ]

  const hasChartData = chartData.some(d => d.income || d.expense)

  return (
    <div className="dashboard">

      {/* ── Greeting ── */}
      <div className="dashboard-greeting animate-fadeup">
        <div className="greeting-left">
          <h2 className="greeting-text">{getThaiGreeting()}</h2>
          <p className="greeting-sub">
            {new Intl.DateTimeFormat('th-TH', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            }).format(new Date())}
          </p>
        </div>
        {todoCounts.dueToday > 0 && (
          <div className="greeting-alert">
            <span className="greeting-alert-dot"/>
            มีงาน {todoCounts.dueToday} รายการที่ต้องทำวันนี้
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <p className="section-label">ภาพรวมเดือนนี้</p>
        </div>
        <div className="stat-cards stagger">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} style={{ animationDelay: `${i * 55}ms` }}/>
          ))}
        </div>
      </section>

      {/* ── Chart + Todo ── */}
      <div className="dashboard-cols">

        {/* Finance chart */}
        <div className="card card-pad-lg dashboard-chart-card">
          <div className="dashboard-card-header">
            <p className="section-label">รายรับ-รายจ่าย 6 เดือน</p>
            <Link to="/finance" className="section-link-sm">ดูรายละเอียด →</Link>
          </div>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: '#5a5a7a', fontSize: 12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="income"  name="รายรับ"  stroke="#4ade80" fill="url(#gi)" strokeWidth={2}/>
                <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#f43f5e" fill="url(#ge)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <span className="chart-empty-icon">📊</span>
              <p>ยังไม่มีข้อมูลการเงิน</p>
              <Link to="/finance" className="btn btn-ghost btn-size-sm" style={{ marginTop: 8 }}>
                เพิ่มรายการ →
              </Link>
            </div>
          )}
        </div>

        {/* Todo list */}
        <div className="card card-pad-lg">
          <div className="dashboard-card-header">
            <p className="section-label">งานล่าสุด</p>
            <span className="dash-badge">{todoCounts.pending} รอ</span>
          </div>
          <div className="todo-list">
            {todos.length > 0
              ? todos.map(t => <TodoMini key={t.id} todo={t} onToggle={handleToggle}/>)
              : (
                <div className="dash-empty">
                  <span>🎉</span>
                  <p>ไม่มีงานค้าง</p>
                  <Link to="/todo" className="btn btn-ghost btn-size-sm">เพิ่มงาน</Link>
                </div>
              )
            }
          </div>
          <Link to="/todo" className="section-link">ดูทั้งหมด →</Link>
        </div>

      </div>

      {/* ── Goals ── */}
      {goals.length > 0 && (
        <div className="card card-pad-lg animate-fadeup" style={{ animationDelay: '180ms' }}>
          <div className="dashboard-card-header" style={{ marginBottom: 16 }}>
            <p className="section-label">เป้าหมายชีวิต</p>
            <Link to="/goals" className="section-link-sm">ดูทั้งหมด →</Link>
          </div>
          <div className="goals-mini-grid">
            {goals.map(g => <GoalMini key={g.id} goal={g}/>)}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="card card-pad-lg dash-goals-empty animate-fadeup" style={{ animationDelay: '200ms' }}>
          <span>🎯</span>
          <div>
            <p>ยังไม่มีเป้าหมาย</p>
            <span>กำหนดเป้าหมายชีวิตและติดตามความคืบหน้า</span>
          </div>
          <Link to="/goals" className="btn btn-primary btn-size-sm">ตั้งเป้าหมาย</Link>
        </div>
      )}

      {/* ── PWA install hint ── */}
      {pwaHint && (
        <div className="pwa-hint animate-fadeup" style={{ animationDelay: '400ms' }}>
          <span className="pwa-hint-icon">📱</span>
          <div className="pwa-hint-text">
            <p>เพิ่มไปยัง Home Screen</p>
            <span>Safari → Share → "Add to Home Screen" เพื่อใช้งานแบบแอป offline</span>
          </div>
          <button className="btn btn-ghost btn-size-sm" onClick={() => setPwaHint(false)}>
            รับทราบ
          </button>
        </div>
      )}

    </div>
  )
}
