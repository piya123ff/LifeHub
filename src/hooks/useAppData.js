import { useEffect } from 'react'
import { appDataService } from '../services/appDataService.js'

/**
 * useAppData — call once at App root.
 * Seeds demo data on first launch.
 */
export function useAppData() {
  useEffect(() => {
    appDataService.seedIfEmpty()
  }, [])
}
