// healthUtils.js — Phase 4

export const DEFAULT_WATER_GOAL_ML = 2000
export const DEFAULT_WEIGHT_GOAL   = null

/** Quick-add water amounts in ml */
export const WATER_QUICK_ML = [150, 250, 350, 500]

/** Format ml → "2,000 มล." or "1.5 ล." */
export function formatWater(ml) {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} ล.`
  return `${ml.toLocaleString('th-TH')} มล.`
}

/** Water progress percentage (capped at 100) */
export function waterProgress(ml, goalMl) {
  if (!goalMl || goalMl <= 0) return 0
  return Math.min(100, Math.round((ml / goalMl) * 100))
}

/** Weight trend: latest minus 7-days-ago (kg) */
export function weightTrend(history) {
  if (history.length < 2) return null
  const latest = history[history.length - 1].weight
  const older  = history[0].weight
  return +(latest - older).toFixed(1)
}

/** Today's ISO date string */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Format date → Thai short */
export function formatDateTH(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Validate weight entry */
export function validateWeight({ weight }) {
  const errors = {}
  const w = parseFloat(weight)
  if (!weight || isNaN(w) || w <= 0 || w > 500) errors.weight = 'กรุณาระบุน้ำหนักที่ถูกต้อง (kg)'
  return errors
}

/** BMI category label (rough) */
export function bmiLabel(bmi) {
  if (bmi < 18.5) return { label: 'น้ำหนักน้อย', color: 'var(--accent-blue)'   }
  if (bmi < 25)   return { label: 'ปกติ',         color: 'var(--accent-green)'  }
  if (bmi < 30)   return { label: 'น้ำหนักเกิน',  color: 'var(--accent-amber)'  }
  return               { label: 'อ้วน',           color: 'var(--accent-rose)'   }
}

/** Calculate sleep duration in minutes (handles crossing midnight) */
export function calcSleepDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bedMins  = bh * 60 + bm
  let wakeMins = wh * 60 + wm
  if (wakeMins <= bedMins) wakeMins += 1440 // crosses midnight
  return wakeMins - bedMins
}

/** Format minutes → "7ชม. 30นาที" */
export function formatDuration(mins) {
  if (!mins && mins !== 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}นาที`
  if (m === 0) return `${h}ชม.`
  return `${h}ชม. ${m}นาที`
}

/** Sleep quality label */
export function sleepQualityLabel(q) {
  const map = { 1: 'แย่มาก', 2: 'แย่', 3: 'ปานกลาง', 4: 'ดี', 5: 'ดีมาก' }
  return map[q] || ''
}
