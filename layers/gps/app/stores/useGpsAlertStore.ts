import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GpsAlert } from '~~/shared/types/db'

export const useGpsAlertStore = defineStore('gps-alert', () => {
  const alerts = ref<GpsAlert[]>([])
  const lastFetchAt = ref(0)

  const markFetched = () => {
    lastFetchAt.value = Date.now()
  }

  const isCacheFresh = (ttlMs: number) => {
    if (!lastFetchAt.value) return false
    return Date.now() - lastFetchAt.value < ttlMs
  }

  return {
    alerts,
    lastFetchAt,
    markFetched,
    isCacheFresh
  }
})
