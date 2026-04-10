import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import useFilter from './useFilter'
import { useAreaStaysStore, type FieldStayReport } from '../stores/useAreaStaysStore'
import { cacheMaxAgeFromPinia } from '~~/utils/cache-max-age'
import { shouldUsePiniaCache } from '~~/app/composables/usePiniaCacheGuard'

const AREA_STAYS_PINIA_TTL_MS = cacheMaxAgeFromPinia.fieldStaysReport * 1000

export function useAreaStays() {

  const areaStaysStore = useAreaStaysStore()
  const { report } = storeToRefs(areaStaysStore)
  const { validateFilters } = useFilter()

  const isLoading = ref(false)
  const errorMessage = ref('')
  const selectedField = ref('all')

  const fieldOptions = computed(() => {
    const names = Array.from(new Set((report.value?.stays ?? []).map(stay => stay.fieldName))).sort((a, b) => a.localeCompare(b))
    return [
      { label: 'Todos los campos', value: 'all' },
      ...names.map(name => ({ label: name, value: name }))
    ]
  })

  const rows = computed(() => {
    const source = report.value?.stays ?? []
    if (selectedField.value === 'all') return source
    return source.filter(stay => stay.fieldName === selectedField.value)
  })

  const fetchAreaStays = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
    const showValidationMessage = options?.showValidationMessage ?? true
    const force = options?.force === true
    if (showValidationMessage) errorMessage.value = ''

    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationMessage) errorMessage.value = validation.message
      return
    }

    const { devices, start, end } = validation
    const queryKey = buildDeviceRangeCacheKey(devices, start, end)

    if (shouldUsePiniaCache({
      force,
      hasData: Boolean(report.value?.stays?.length),
      isFresh: areaStaysStore.isCacheFresh(queryKey, AREA_STAYS_PINIA_TTL_MS)
    })) {
      return
    }

    isLoading.value = true
    try {
      const endpoint = '/api/field-stays/report' as string
      report.value = await $fetch<FieldStayReport>(endpoint, {
        method: 'POST',
        body: { devices, start, end }
      })
      areaStaysStore.setCacheMeta(queryKey)

      if (selectedField.value !== 'all' && !rows.value.length) {
        selectedField.value = 'all'
      }
    } catch (error: any) {
      console.error('Error consultando estadias por area:', error)
      errorMessage.value = error?.data?.message || 'No se pudo cargar el reporte de ingresos/salidas por area.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    report,
    errorMessage,
    selectedField,
    fieldOptions,
    rows,
    fetchAreaStays
  }
}

