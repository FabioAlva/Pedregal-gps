import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteAnalysisByDevice } from '../types/IRouteAnalysis'

export const useRouteAnalysisStore = defineStore('gps-route-analysis', () => {
  const report = ref<RouteAnalysisByDevice>({})
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
