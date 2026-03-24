import type { GpsAlert, NewGpsAlert } from '~~/shared/types/db'
import { storeToRefs } from 'pinia'
import { useGpsAlertStore } from '../stores/useGpsAlertStore'
import { cacheMaxAgeFromPinia } from '../../server/utils/cache-max-age'
import { shouldUsePiniaCache } from './usePiniaCacheGuard'

const GPS_ALERTS_PINIA_TTL_MS = cacheMaxAgeFromPinia.gpsAlerts * 1000

export const useGpsAlerts = () => {

  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const alertsStore = useGpsAlertStore()
  const { alerts } = storeToRefs(alertsStore)
  
  /*Todas las alertas */
  const fetchAll = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? GPS_ALERTS_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: alerts.value.length > 0,
      isFresh: alertsStore.isCacheFresh(ttlMs)
    })) {
      return
    }

    loading.value = true
    error.value = null
    try {
      alerts.value = await $fetch<GpsAlert[]>('/api/gps-alert')
      alertsStore.markFetched()
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar las alertas'
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      return await $fetch<GpsAlert>(`/api/gps-alert/${id}`)
    } catch (e: any) {
      error.value = e?.message ?? 'Error al cargar la alerta'
      return null
    } finally {
      loading.value = false
    }
  }

  const create = async (data: NewGpsAlert) => {
    saving.value = true
    error.value = null
    try {
      await $fetch<number>('/api/gps-alert', {
        method: 'POST',
        body: data
      })
      await fetchAll({ force: true })
    } catch (e: any) {
      error.value = e?.message ?? 'Error al crear la alerta'
    } finally {
      saving.value = false
    }
  }

  const update = async (id: number, data: Partial<NewGpsAlert>) => {
    saving.value = true
    error.value = null
    try {
      await $fetch(`/api/gps-alert/${id}`, {
        method: 'PATCH',
        body: data
      })
      await fetchAll({ force: true })
    } catch (e: any) {
      error.value = e?.message ?? 'Error al guardar la alerta'
    } finally {
      saving.value = false
    }
  }

  const updateActive = async (id: number, activo: boolean) => {
    saving.value = true
    error.value = null
    try {
      await $fetch(`/api/gps-alert/${id}`, {
        method: 'PATCH',
        body: { activo }
      })
      await fetchAll({ force: true })
    } catch (e: any) {
      error.value = e?.message ?? 'Error al actualizar el estado'
    } finally {
      saving.value = false
    }
  }

  const remove = async (id: number) => {
    saving.value = true
    error.value = null
    try {
      await $fetch(`/api/gps-alert/${id}`, {
        method: 'DELETE'
      })
      await fetchAll({ force: true })
    } catch (e: any) {
      error.value = e?.message ?? 'Error al eliminar la alerta'
    } finally {
      saving.value = false
    }
  }

  return {
    alerts,
    loading,
    saving,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    updateActive,
    remove
  }
}
