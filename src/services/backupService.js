import { storageGet, storageSet, storageClear, STORAGE_KEYS, SCHEMA_VERSION } from './storageService.js'

export const backupService = {
  export() {
    const payload = {
      version:    SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      finance:    storageGet(STORAGE_KEYS.FINANCE,  []),
      todos:      storageGet(STORAGE_KEYS.TODOS,    []),
      workouts:   storageGet(STORAGE_KEYS.WORKOUTS, []),
      health:     storageGet(STORAGE_KEYS.HEALTH,   []),
      goals:      storageGet(STORAGE_KEYS.GOALS,    []),
      settings:   storageGet(STORAGE_KEYS.SETTINGS, {}),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `lifehub-backup-${new Date().toISOString().slice(0, 10)}.json`,
    })
    a.click()
    URL.revokeObjectURL(url)
    return true
  },

  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = ({ target }) => {
        try {
          const data = JSON.parse(target.result)
          if (data.finance)  storageSet(STORAGE_KEYS.FINANCE,  data.finance)
          if (data.todos)    storageSet(STORAGE_KEYS.TODOS,    data.todos)
          if (data.workouts) storageSet(STORAGE_KEYS.WORKOUTS, data.workouts)
          if (data.health)   storageSet(STORAGE_KEYS.HEALTH,   data.health)
          if (data.goals)    storageSet(STORAGE_KEYS.GOALS,    data.goals)
          if (data.settings) storageSet(STORAGE_KEYS.SETTINGS, data.settings)
          resolve({ success: true, version: data.version })
        } catch {
          reject(new Error('ไฟล์ backup ไม่ถูกต้องหรือเสียหาย'))
        }
      }
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'))
      reader.readAsText(file)
    })
  },

  clearAll: () => storageClear(),

  getStorageSize() {
    let total = 0
    Object.values(STORAGE_KEYS).forEach(k => {
      const v = localStorage.getItem(k)
      if (v) total += v.length * 2 // UTF-16
    })
    return total
  },
}
