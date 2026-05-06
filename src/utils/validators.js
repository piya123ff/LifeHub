export function required(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export function positiveNumber(value) {
  const n = Number(value)
  return !isNaN(n) && n > 0
}

export function validateFinanceEntry({ amount, type, category }) {
  const errors = {}
  if (!positiveNumber(amount))   errors.amount   = 'กรุณากรอกจำนวนเงินที่ถูกต้อง'
  if (!type)                     errors.type     = 'กรุณาเลือกประเภท'
  if (!required(category))       errors.category = 'กรุณาเลือกหมวดหมู่'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateTodo({ title }) {
  const errors = {}
  if (!required(title)) errors.title = 'กรุณากรอกชื่องาน'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateWorkout({ type, duration }) {
  const errors = {}
  if (!required(type))          errors.type     = 'กรุณาเลือกประเภท'
  if (!positiveNumber(duration)) errors.duration = 'กรุณากรอกเวลา'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateGoal({ title, target }) {
  const errors = {}
  if (!required(title))        errors.title  = 'กรุณากรอกชื่อเป้าหมาย'
  if (!positiveNumber(target)) errors.target = 'กรุณากรอกค่าเป้าหมาย'
  return { valid: Object.keys(errors).length === 0, errors }
}
