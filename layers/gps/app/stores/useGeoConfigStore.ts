import { defineStore } from 'pinia'
import { ref } from 'vue'

type CenterCoords = [number, number]

export const useGeoConfigStore = defineStore('gps-geo-config', () => {
  const center = ref<CenterCoords | null>(null)
  const boundary = ref<CenterCoords[]>([])
  const lastFetchAt = ref(0)

  const markFetched = () => {
    lastFetchAt.value = Date.now()
  }

  const isCacheFresh = (ttlMs: number) => {
    if (!lastFetchAt.value) return false
    return Date.now() - lastFetchAt.value < ttlMs
  }

  return {
    center,
    boundary,
    lastFetchAt,
    markFetched,
    isCacheFresh
  }
})
