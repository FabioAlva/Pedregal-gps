import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { Field, NewField } from '~~/shared/types/db'
import { useFieldStore } from '../stores/useFieldStore'
import { cacheMaxAgeFromPinia } from '~~/utils/cache-max-age'
import { shouldUsePiniaCache } from '~~/app/composables/usePiniaCacheGuard'

const FIELDS_PINIA_TTL_MS = cacheMaxAgeFromPinia.fieldsList * 1000

export function useFields() {
  const searchResults = ref<Field[]>([])
  const isSaving = ref(false)
  const fieldStore = useFieldStore()
  const { fields } = storeToRefs(fieldStore)

  const fetchFields = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? FIELDS_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: fields.value.length > 0,
      isFresh: fieldStore.isCacheFresh(ttlMs)
    })) {
      return
    }

    try {
      const res = await fetch('/api/fields')
      fields.value = await res.json()
      fieldStore.markFetched()
    } catch (err) {
      console.error('Error al cargar campos:', err)
    }
  }

  const saveField = async (payload: NewField) => {
    isSaving.value = true
    try {
      await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await fetchFields({ force: true })
      return true
    } catch (err) {
      console.error('Error al guardar campo:', err)
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateField = async (id: number, payload: Partial<Field>) => {
    try {
      await $fetch(`/api/fields/${id}`, {
        method: 'PATCH',
        body: payload
      })
      await fetchFields({ force: true })
      return true
    } catch (err) {
      console.error('Error al actualizar campo:', err)
      return false
    }
  }

  const deleteField = async (id: number) => {
    try {
      await $fetch(`/api/fields/${id}`, { method: 'DELETE' as const })
      await fetchFields({ force: true })
    } catch (err) {
      console.error('Error al eliminar campo:', err)
    }
  }

  const importGeojson = async () => {
    try {
      console.log('[fields.import] request')
      const result = await $fetch('/api/fields/import', { method: 'POST' })
      console.log('[fields.import] response', result)
      await fetchFields({ force: true })
      return true
    } catch (err) {
      console.error('Error al importar GeoJSON:', err)
      return false
    }
  }

  const searchPlace = async (query: string) => {
    if (query.length < 3) return
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
    searchResults.value = await res.json()
  }

  return {
    fields,
    searchResults,
    isSaving,
    fetchFields,
    saveField,
    updateField,
    deleteField,
    importGeojson,
    searchPlace
  }
}
