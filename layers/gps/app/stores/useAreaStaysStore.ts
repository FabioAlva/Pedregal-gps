import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FieldStayRow {
  id: number
  fieldName: string
  deviceId: string
  enteredAt: string
  exitedAt: string | null
  durationSeconds: number
  durationMinutes: number
  fleetEquipmentId: number
}

export interface FieldStayReport {
  start: string
  end: string
  totalSeconds: number
  totalMinutes: number
  totalHours: number
  count: number
  stays: FieldStayRow[]
}

export const useAreaStaysStore = defineStore('gps-area-stays', () => {
  const report = ref<FieldStayReport | null>(null)
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
    report,
    lastFetchAt,
    lastQueryKey,
    setCacheMeta,
    isCacheFresh
  }
})

