import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Geofence } from '~~/shared/types/db'

export const useGeofenceStore = defineStore('gps-geofence', () => {
  const geofences = ref<Geofence[]>([])
  const lastFetchAt = ref(0)

  const markFetched = () => {
    lastFetchAt.value = Date.now()
  }

  const isCacheFresh = (ttlMs: number) => {
    if (!lastFetchAt.value) return false
    return Date.now() - lastFetchAt.value < ttlMs
  }

  return {
    geofences,
    lastFetchAt,
    markFetched,
    isCacheFresh
  }
})
