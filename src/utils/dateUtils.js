export const LOCALE = 'th-TH'

export function formatDate(iso, opts = {}) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric', ...opts,
  }).format(new Date(iso))
}

export function formatDateFull(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

export function formatRelative(iso) {
  if (!iso) return '—'
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'เมื่อกี้'
  if (mins  < 60) return `${mins} นาทีที่แล้ว`
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  if (days  < 7)  return `${days} วันที่แล้ว`
  return formatDate(iso)
}

export function formatDuration(minutes) {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} นาที`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}ชม. ${m}นาที` : `${h} ชั่วโมง`
}

export function isToday(iso) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
