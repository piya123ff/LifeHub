/**
 * backupService.js
 * Full Export / Import / Validate / Merge for all LifeHub data.
 */
import {
  storageGet, storageSet, storageClear,
  STORAGE_KEYS, SCHEMA_VERSION,
} from './storageService.js'

/* ── Manifest of all backup-able keys ── */
export const BACKUP_MANIFEST = [
  { key: 'finance',    storage: STORAGE_KEYS.FINANCE,    label: '💰 การเงิน',     type: 'array',  icon: '💰' },
  { key: 'saving_goals', storage: STORAGE_KEYS.SAVING_GOALS, label: '🎯 เงินออม', type: 'array', icon: '🎯' },
  { key: 'todos',      storage: STORAGE_KEYS.TODOS,      label: '✅ To-Do',        type: 'array',  icon: '✅' },
  { key: 'workouts',   storage: STORAGE_KEYS.WORKOUTS,   label: '🏋️ Workout',     type: 'array',  icon: '🏋️' },
  { key: 'health',     storage: STORAGE_KEYS.HEALTH,     label: '❤️ สุขภาพ',      type: 'array',  icon: '❤️' },
  { key: 'goals',      storage: STORAGE_KEYS.GOALS,      label: '🎯 เป้าหมาย',    type: 'array',  icon: '🎯' },
  { key: 'habits',     storage: STORAGE_KEYS.HABITS,     label: '🔁 Habits',       type: 'array',  icon: '🔁' },
  { key: 'habit_logs', storage: STORAGE_KEYS.HABIT_LOGS, label: '📅 Habit Logs',   type: 'object', icon: '📅' },
  { key: 'budgets',    storage: STORAGE_KEYS.BUDGETS,    label: '📊 งบประมาณ',    type: 'object', icon: '📊' },
  { key: 'sleep_logs', storage: STORAGE_KEYS.SLEEP_LOGS, label: '😴 Sleep',        type: 'array',  icon: '😴' },
  { key: 'settings',   storage: STORAGE_KEYS.SETTINGS,   label: '⚙️ Settings',     type: 'object', icon: '⚙️' },
]

const ARRAY_KEYS  = BACKUP_MANIFEST.filter(m => m.type === 'array').map(m => m.key)
const OBJECT_KEYS = BACKUP_MANIFEST.filter(m => m.type === 'object').map(m => m.key)

/* ───────────────────────────────────────────────── */
export const backupService = {

  /* ── Build payload ─────────────────────────────── */
  _buildPayload() {
    const payload = {
      app:        'LifeHub',
      version:    SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    }
    BACKUP_MANIFEST.forEach(({ key, storage, type }) => {
      payload[key] = storageGet(storage, type === 'array' ? [] : {})
    })
    return payload
  },

  /* ── Export ────────────────────────────────────── */
  export() {
    const payload = this._buildPayload()
    const json    = JSON.stringify(payload, null, 2)
    const blob    = new Blob([json], { type: 'application/json' })
    const url     = URL.createObjectURL(blob)
    const fname   = `lifehub-backup-${new Date().toISOString().slice(0, 10)}.json`
    const a       = Object.assign(document.createElement('a'), { href: url, download: fname })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return fname
  },

  /* ── Validate ──────────────────────────────────── */
  validate(data) {
    const errors   = []
    const warnings = []

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, errors: ['ไฟล์ไม่ใช่ JSON object ที่ถูกต้อง'], warnings: [] }
    }

    const allKeys   = BACKUP_MANIFEST.map(m => m.key)
    const foundKeys = allKeys.filter(k => data[k] !== undefined)
    if (foundKeys.length === 0) {
      errors.push('ไม่พบข้อมูล LifeHub ในไฟล์นี้ — อาจไม่ใช่ backup ของแอปนี้')
    }

    if (data.app && data.app !== 'LifeHub') {
      warnings.push(`ไฟล์นี้ระบุว่ามาจากแอป "${data.app}" ไม่ใช่ LifeHub`)
    }

    ARRAY_KEYS.forEach(k => {
      if (data[k] !== undefined && !Array.isArray(data[k])) {
        errors.push(`"${k}" ต้องเป็น array แต่ได้ ${typeof data[k]}`)
      }
    })

    OBJECT_KEYS.forEach(k => {
      if (data[k] !== undefined && (typeof data[k] !== 'object' || Array.isArray(data[k]))) {
        errors.push(`"${k}" ต้องเป็น object แต่ได้ ${typeof data[k]}`)
      }
    })

    // Sample-check items have id fields in arrays
    ARRAY_KEYS.forEach(k => {
      if (!Array.isArray(data[k])) return
      const bad = data[k].slice(0, 5).filter(i => !i || typeof i !== 'object' || !i.id)
      if (bad.length > 0) {
        warnings.push(`บางรายการใน "${k}" ไม่มี id — อาจเกิดปัญหาตอน merge`)
      }
    })

    return { valid: errors.length === 0, errors, warnings }
  },

  /* ── Parse file → preview (no side effects) ────── */
  parseFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        reject(new Error('กรุณาเลือกไฟล์ .json เท่านั้น'))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('ไฟล์ใหญ่เกิน 10 MB'))
        return
      }
      const reader = new FileReader()
      reader.onload = ({ target }) => {
        try {
          const data = JSON.parse(target.result)
          const { valid, errors, warnings } = this.validate(data)
          if (!valid) { reject(new Error(errors.join(' | '))); return }
          resolve({ data, stats: this._stats(data), warnings })
        } catch {
          reject(new Error('ไม่สามารถอ่านไฟล์ได้ — ไม่ใช่ JSON หรือเสียหาย'))
        }
      }
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'))
      reader.readAsText(file)
    })
  },

  /* ── Import ────────────────────────────────────── */
  importData(data, mode = 'replace') {
    BACKUP_MANIFEST.forEach(({ key, storage, type }) => {
      if (data[key] === undefined) return

      if (mode === 'merge') {
        if (type === 'array') {
          const existing    = storageGet(storage, [])
          const existingIds = new Set(existing.map(i => i?.id).filter(Boolean))
          const incoming    = data[key].filter(i => i?.id && !existingIds.has(i.id))
          storageSet(storage, [...existing, ...incoming])
        } else {
          // object: incoming fills gaps, existing keys win
          const existing = storageGet(storage, {})
          storageSet(storage, { ...data[key], ...existing })
        }
      } else {
        storageSet(storage, data[key])
      }
    })
    return true
  },

  /* ── Import from File (promise) ─────────────────── */
  importFile(file, mode = 'replace') {
    return this.parseFile(file).then(({ data }) => {
      this.importData(data, mode)
      return { success: true }
    })
  },

  /* ── Reset ─────────────────────────────────────── */
  clearAll: () => storageClear(),

  /* ── Stats ─────────────────────────────────────── */
  _stats(data) {
    const cnt = (key, type) => {
      const v = data[key]
      if (v === undefined) return null
      if (type === 'array')  return Array.isArray(v) ? v.length : '?'
      if (type === 'object') return typeof v === 'object' ? Object.keys(v).length : '?'
      return null
    }
    return {
      version:    data.version    || 'unknown',
      exportedAt: data.exportedAt ? new Date(data.exportedAt).toLocaleString('th-TH') : '—',
      ...Object.fromEntries(BACKUP_MANIFEST.map(m => [m.key, cnt(m.key, m.type)])),
    }
  },

  getCurrentStats() {
    return this._stats(
      Object.fromEntries(
        BACKUP_MANIFEST.map(({ key, storage, type }) => [
          key, storageGet(storage, type === 'array' ? [] : {}),
        ])
      )
    )
  },

  getStorageSize() {
    let total = 0
    Object.values(STORAGE_KEYS).forEach(k => {
      const v = localStorage.getItem(k)
      if (v) total += v.length * 2
    })
    return total
  },
}
