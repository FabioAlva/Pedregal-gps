import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGeoConfigStore } from '../stores/useGeoConfigStore'

const GEO_CONFIG_TTL_MS = 5 * 60 * 1000

type CenterCoords = [number, number]

type GeoConfigPayload = {
  center?: CenterCoords | null
  boundary?: CenterCoords[]
}

export function useGeoConfig() {
  const store = useGeoConfigStore()
  const { center, boundary } = storeToRefs(store)
  const isSaving = ref(false)

  const fetchConfig = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? GEO_CONFIG_TTL_MS

    if (!force && store.isCacheFresh(ttlMs)) return

    const res = await fetch('/api/geo-config')
    const data = await res.json()

    center.value = data?.center ?? null
    boundary.value = data?.boundary ?? []
    store.markFetched()
  }

  const saveConfig = async (payload: GeoConfigPayload) => {
    isSaving.value = true
    try {
      await $fetch('/api/geo-config', {
        method: 'PATCH',
        body: payload
      })
      await fetchConfig({ force: true })
      return true
    } catch (err) {
      console.error('Error al guardar configuracion:', err)
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    center,
    boundary,
    isSaving,
    fetchConfig,
    saveConfig
  }
}
