import type { GpsAlertLog } from '~~/shared/types/db'
import { storeToRefs } from 'pinia'
import { useGpsAlertLogStore } from '../stores/useGpsAlertLogStore'
import { cacheMaxAgeFromPinia } from '../../server/utils/cache-max-age'
import { shouldUsePiniaCache } from './usePiniaCacheGuard'

const GPS_ALERT_LOGS_PINIA_TTL_MS = cacheMaxAgeFromPinia.gpsAlertLogs * 1000

export const useGpsAlertLogs = () => {

  const loading = ref(false)
  const error = ref<string | null>(null)

  const logsStore = useGpsAlertLogStore()
  const { logs } = storeToRefs(logsStore)
  const toErrorMessage = (e: unknown, fallback: string) => {
    if (e instanceof Error) return e.message
    return fallback
  }

  const fetchLogs = async (endpoint: string, options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? GPS_ALERT_LOGS_PINIA_TTL_MS
    const queryKey = endpoint

    if (shouldUsePiniaCache({
      force,
      hasData: logs.value.length > 0,
      isFresh: logsStore.isCacheFresh(queryKey, ttlMs)
    })) {
      return
    }

    loading.value = true
    error.value = null
    try {
      logs.value = await $fetch<GpsAlertLog[]>(endpoint)
      logsStore.setCacheMeta(queryKey)
    } catch (e: unknown) {
      error.value = toErrorMessage(e, 'Error al cargar los logs')
    } finally {
      loading.value = false
    }
  }

  const fetchAll = async (options?: { force?: boolean, ttlMs?: number }) => {
    await fetchLogs('/api/gps-alert-logs', options)
  }

  const fetchByAlert = async (alertaId: number, options?: { force?: boolean, ttlMs?: number }) => {
    await fetchLogs(`/api/gps-alert-logs/by-alert/${alertaId}`, options)
  }

  const fetchByEquipment = async (equipmentId: number, options?: { force?: boolean, ttlMs?: number }) => {
    await fetchLogs(`/api/gps-alert-logs/by-equipment/${equipmentId}`, options)
  }

  const exceedsByLimit = (log: GpsAlertLog) => log.valorRegistrado > log.limiteVigente

  const severity = (log: GpsAlertLog) => {
    const diff = log.valorRegistrado - log.limiteVigente
    if (diff <= 0) return 'ok'
    if (diff <= 10) return 'warning'
    return 'critical'
  }

  return { logs, loading, error, fetchAll, fetchByAlert, fetchByEquipment, exceedsByLimit, severity }
}