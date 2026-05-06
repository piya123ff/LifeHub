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
