import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GpsAlertLog } from '~~/shared/types/db'

export const useGpsAlertLogStore = defineStore('gps-alert-log', () => {
  const logs = ref<GpsAlertLog[]>([])
  const lastFetchAt = ref(0)
  const lastQueryKey = ref('')

  const setCacheMeta = (queryKey: string) => {
    lastQueryKey.value = queryKey
    lastFetchAt.value = Date.now()
  }

  const isCacheFresh = (queryKey: string, ttlMs: number) => {
    if (!lastFetchAt.value || lastQueryKey.value !== queryKey) return false
    return Date.now() - lastFetchAt.value < ttlMs
  }

  return {
    logs,
    lastFetchAt,
    lastQueryKey,
    setCacheMeta,
    isCacheFresh
  }
})
