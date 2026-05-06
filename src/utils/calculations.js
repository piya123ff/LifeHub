export function percentage(value, total) {
  if (!total) return 0
  return Math.min(Math.round((value / total) * 100), 100)
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function average(arr) {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export function bmiCategory(bmi) {
  if (!bmi) return '—'
  if (bmi < 18.5) return 'น้ำหนักน้อย'
  if (bmi < 23)   return 'ปกติ'
  if (bmi < 25)   return 'น้ำหนักเกิน'
  if (bmi < 30)   return 'อ้วน'
  return 'อ้วนมาก'
}
