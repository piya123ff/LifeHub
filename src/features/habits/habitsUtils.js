/* ── Categories ── */
export const HABIT_CATEGORIES = [
  { id: 'health',      label: 'สุขภาพ',      emoji: '❤️' },
  { id: 'fitness',     label: 'ออกกำลังกาย', emoji: '💪' },
  { id: 'learning',    label: 'เรียนรู้',     emoji: '📚' },
  { id: 'mindfulness', label: 'สมาธิ',        emoji: '🧘' },
  { id: 'productivity',label: 'งาน',          emoji: '⚡' },
  { id: 'social',      label: 'สังคม',        emoji: '👥' },
  { id: 'finance',     label: 'การเงิน',      emoji: '💰' },
  { id: 'general',     label: 'ทั่วไป',       emoji: '⭐' },
]

/* ── Colors ── */
export const HABIT_COLORS = [
  { id: 'violet', label: 'ม่วง',   hex: '#7c63ff' },
  { id: 'teal',   label: 'เขียว',  hex: '#2dd4bf' },
  { id: 'rose',   label: 'แดง',    hex: '#f43f5e' },
  { id: 'amber',  label: 'เหลือง', hex: '#fbbf24' },
  { id: 'blue',   label: 'น้ำเงิน',hex: '#60a5fa' },
  { id: 'green',  label: 'เขียว',  hex: '#4ade80' },
  { id: 'orange', label: 'ส้ม',    hex: '#fb923c' },
]

export const EMOJI_PRESETS = [
  '⭐','💧','🏃','📚','🧘','💪','🥗','😴',
  '💊','🎯','✍️','🎵','🌱','🙏','💰','🧹',
  '📝','🚴','🏋️','🌅','☕','🫁','🤸','🎨',
]

/* ── helpers ── */
export function getCategoryMeta(id) {
  return HABIT_CATEGORIES.find(c => c.id === id) || HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1]
}

export function getColorHex(id) {
  return HABIT_COLORS.find(c => c.id === id)?.hex || '#7c63ff'
}

/* แปลง 'YYYY-MM-DD' → label ย่อ เช่น 'จ' 'อ' 'พ' */
const DAY_SHORT_TH = ['อา','จ','อ','พ','พฤ','ศ','ส']
export function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_SHORT_TH[d.getDay()]
}

/* validate form */
export function validateHabit(form) {
  const errs = {}
  if (!form.title?.trim()) errs.title = 'กรุณาระบุชื่อ habit'
  return errs
}

/* completion rate color */
export function rateColor(rate) {
  if (rate >= 80) return 'var(--accent-green)'
  if (rate >= 50) return 'var(--accent-amber)'
  return 'var(--accent-rose)'
}
