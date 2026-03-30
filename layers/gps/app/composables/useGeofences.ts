import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { Geofence } from '~~/shared/types/db'
import { useGeofenceStore } from '../stores/useGeofenceStore'
import { cacheMaxAgeFromPinia } from '~~/utils/cache-max-age'
import { shouldUsePiniaCache } from '~~/app/composables/usePiniaCacheGuard'

const GEOFENCE_PINIA_TTL_MS = cacheMaxAgeFromPinia.geofenceList * 1000

export function useGeofences() {

  const searchResults = ref<Geofence[]>([])
  const isSaving = ref(false)
  const geofenceStore = useGeofenceStore()
  const { geofences } = storeToRefs(geofenceStore)
  
  const fetchGeofences = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? GEOFENCE_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: geofences.value.length > 0,
      isFresh: geofenceStore.isCacheFresh(ttlMs)
    })) {
      return
    }

    try {
      const res = await fetch('/api/geofence')
      geofences.value = await res.json()
      geofenceStore.markFetched()
    } catch (err) {
      console.error('Error al cargar geocercas:', err)
    }
  }

  const saveGeofence = async (payload: NewGeofence) => {
    isSaving.value = true
    try {
      await fetch(`/api/geofence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await fetchGeofences({ force: true })
      return true
    } catch (err) {
      console.error('Error al guardar geocerca:', err)
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateGeofence = async (id: number, payload: Partial<Geofence>) => {
    try {
      await $fetch(`/api/geofence/${id}`, {
        method: 'PATCH',
        body: payload
      })
      await fetchGeofences({ force: true })
    } catch (err) {
      console.error('Error al actualizar:', err)
    }
  }

  const deleteGeofence = async (id: number) => {
    try {
      await $fetch(`/api/geofence/${id}`, { method: 'DELETE' as const })
      await fetchGeofences({ force: true })
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  const searchPlace = async (query: string) => {
    if (query.length < 3) return
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
    searchResults.value = await res.json()
  }

  return { geofences, searchResults, isSaving, fetchGeofences, saveGeofence, deleteGeofence, updateGeofence, searchPlace }
}
