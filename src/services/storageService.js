/**
 * storageService.js
 * Core localStorage read/write engine.
 */
export const STORAGE_PREFIX = 'lifehub_'
export const SCHEMA_VERSION = '1.0.0'

export const STORAGE_KEYS = {
  FINANCE:  `${STORAGE_PREFIX}finance`,
  TODOS:    `${STORAGE_PREFIX}todos`,
  WORKOUTS: `${STORAGE_PREFIX}workouts`,
  HEALTH:   `${STORAGE_PREFIX}health`,
  GOALS:    `${STORAGE_PREFIX}goals`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  SEEDED:   `${STORAGE_PREFIX}seeded`,
}

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`[LifeHub] storageSet failed "${key}":`, e)
    return false
  }
}

export function storageRemove(key) { localStorage.removeItem(key) }

export function storageClear() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
