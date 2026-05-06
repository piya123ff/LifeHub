import { storageGet, storageSet, storageClear, STORAGE_KEYS } from './storageService.js'

export const appDataService = {
  /** Mark as seeded on first launch (no demo data inserted) */
  seedIfEmpty() {
    if (storageGet(STORAGE_KEYS.SEEDED)) return
    storageSet(STORAGE_KEYS.SEEDED, true)
  },

  getSettings: () => storageGet(STORAGE_KEYS.SETTINGS, {
    currency: 'THB',
    language: 'th',
    theme:    'dark',
    userName: '',
  }),

  updateSettings(data) {
    const current = storageGet(STORAGE_KEYS.SETTINGS, {})
    return storageSet(STORAGE_KEYS.SETTINGS, { ...current, ...data })
  },

  /** ล้างข้อมูลทั้งหมด แล้ว reload */
  resetAllData() {
    storageClear()
    window.location.reload()
  },
}
