// workoutUtils.js — V2
// All original exports preserved + new V2 helpers

/** Workout types with emoji, label, and calorie-per-minute estimate */
export const WORKOUT_TYPES = [
  { id: 'running',    label: 'วิ่ง',          emoji: '🏃', calPerMin: 9  },
  { id: 'walking',    label: 'เดิน',           emoji: '🚶', calPerMin: 4  },
  { id: 'cycling',    label: 'ปั่นจักรยาน',   emoji: '🚴', calPerMin: 7  },
  { id: 'swimming',   label: 'ว่ายน้ำ',        emoji: '🏊', calPerMin: 8  },
  { id: 'weights',    label: 'ยกน้ำหนัก',     emoji: '🏋️', calPerMin: 5  },
  { id: 'hiit',       label: 'HIIT',           emoji: '⚡', calPerMin: 11 },
  { id: 'yoga',       label: 'โยคะ',           emoji: '🧘', calPerMin: 3  },
  { id: 'stretching', label: 'Stretching',    emoji: '🤸', calPerMin: 2  },
  { id: 'other',      label: 'อื่นๆ',          emoji: '💪', calPerMin: 5  },
]

export function getWorkoutTypeMeta(id) {
  return WORKOUT_TYPES.find(t => t.id === id) ?? { id, label: id, emoji: '💪', calPerMin: 5 }
}

/** Auto-estimate calories from type + duration (minutes) */
export function estimateCalories(typeId, durationMin) {
  const meta = getWorkoutTypeMeta(typeId)
  return Math.round(meta.calPerMin * (Number(durationMin) || 0))
}

/** Today as YYYY-MM-DD */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Format date → Thai short locale */
export function formatDateTH(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Format seconds → MM:SS or HH:MM:SS */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return String(h).padStart(2, '0') + ':' +
           String(m).padStart(2, '0') + ':' +
           String(sec).padStart(2, '0')
  }
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}

/** Calculate workout streak (consecutive days with at least 1 session). */
export function calcStreak(sessions) {
  if (!sessions.length) return 0
  const uniqueDays = [...new Set(
    sessions.map(s => new Date(s.date).toISOString().slice(0, 10))
  )].sort().reverse()
  const todayStr     = todayISO()
  const yesterdayStr = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) return 0
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diff = Math.round((prev - curr) / 864e5)
    if (diff === 1) { streak++ } else { break }
  }
  return streak
}

/** Check if any session is dated today */
export function workedOutToday(sessions) {
  const today = new Date().toDateString()
  return sessions.some(s => new Date(s.date).toDateString() === today)
}

/** Build last-7-days chart data */
export function buildWeekChart(sessions) {
  const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  return Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(); d.setDate(d.getDate() - (6 - i))
    const str = d.toDateString()
    const rows = sessions.filter(s => new Date(s.date).toDateString() === str)
    return {
      day:      days[d.getDay()],
      minutes:  rows.reduce((s, w) => s + (w.duration || 0), 0),
      calories: rows.reduce((s, w) => s + (w.calories  || 0), 0),
      sessions: rows.length,
      isToday:  str === new Date().toDateString(),
    }
  })
}

/** Validate legacy workout session form */
export function validateWorkout({ type, duration }) {
  const errors = {}
  if (!type) errors.type = 'กรุณาเลือกประเภท'
  const d = Number(duration)
  if (!duration || isNaN(d) || d <= 0 || d > 720) errors.duration = 'กรุณาระบุเวลา 1–720 นาที'
  return errors
}
