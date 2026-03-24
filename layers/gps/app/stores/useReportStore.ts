import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DeviceSpeedReport, StopPoint } from '../types/IUserReport'

export const useReportStore = defineStore('gps-report', () => {
  const distanceRawData = ref<Record<string, number>>({})
  const speedRawData = ref<Record<string, DeviceSpeedReport>>({})
  const stopRawData = ref<Record<string, StopPoint[]>>({})
  const distanceFetchAt = ref(0)
  const speedFetchAt = ref(0)
  const stopFetchAt = ref(0)
  const distanceQueryKey = ref('')
  const speedQueryKey = ref('')
  const stopQueryKey = ref('')

  const setDistanceCacheMeta = (queryKey: string) => {
    distanceQueryKey.value = queryKey
    distanceFetchAt.value = Date.now()
  }

  const setSpeedCacheMeta = (queryKey: string) => {
    speedQueryKey.value = queryKey
    speedFetchAt.value = Date.now()
  }

  const setStopCacheMeta = (queryKey: string) => {
    stopQueryKey.value = queryKey
    stopFetchAt.value = Date.now()
  }

  const isDistanceCacheFresh = (queryKey: string, ttlMs: number) => {
    if (!distanceFetchAt.value || distanceQueryKey.value !== queryKey) return false
    return Date.now() - distanceFetchAt.value < ttlMs
  }

  const isSpeedCacheFresh = (queryKey: string, ttlMs: number) => {
    if (!speedFetchAt.value || speedQueryKey.value !== queryKey) return false
    return Date.now() - speedFetchAt.value < ttlMs
  }

  const isStopCacheFresh = (queryKey: string, ttlMs: number) => {
    if (!stopFetchAt.value || stopQueryKey.value !== queryKey) return false
    return Date.now() - stopFetchAt.value < ttlMs
  }

  return {
    distanceRawData,
    speedRawData,
    stopRawData,
    distanceFetchAt,
    speedFetchAt,
    stopFetchAt,
    distanceQueryKey,
    speedQueryKey,
    stopQueryKey,
    setDistanceCacheMeta,
    setSpeedCacheMeta,
    setStopCacheMeta,
    isDistanceCacheFresh,
    isSpeedCacheFresh,
    isStopCacheFresh
  }
})
