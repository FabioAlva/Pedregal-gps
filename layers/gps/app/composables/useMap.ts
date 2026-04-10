import { storeToRefs } from 'pinia'
import { useMapStore } from '../stores/useMapStore'
import { useGeoConfigStore } from '../stores/useGeoConfigStore'
import useFilter from './useFilter'
import { formatLocalDate } from '../utils/FormatTime'
import type { ProcessedRoute } from '../types/IMap'
import { cacheMaxAgeFromPinia } from '~~/utils/cache-max-age'
import { buildDeviceRangeCacheKey, shouldUsePiniaCache } from '../../../../app/composables/usePiniaCacheGuard'

const MAP_ROUTE_PINIA_TTL_MS = cacheMaxAgeFromPinia.mapRoute * 1000

export function useMap() {
  
  const toast = useToast()
  const store = useMapStore()
  const geoConfigStore = useGeoConfigStore()
  const { allRoutes, center, deviceStatus } = storeToRefs(store)
  const { center: configCenter } = storeToRefs(geoConfigStore)
  const { listDevice, selectedDevice, validateFilters } = useFilter()
  const isLoading = ref(false)

  const updateCenterFromData = (data: Record<string, any>) => {

    if (selectedDevice.value === 'all') {
      center.value = configCenter.value ?? [-5.1961, -80.6266]
      return
    }

    const device = data[selectedDevice.value]
    if (device?.lastPoint?.lat != null) {
      center.value = [device.lastPoint.lat, device.lastPoint.lng]
    }
     else {
      toast.add({
        title: 'Ubicación no disponible',
        icon: 'i-lucide-triangle-alert'
      })
    }
  }

  const processedRoutes = computed<ProcessedRoute[]>(() => {
    const entries = Object.entries(allRoutes.value)
    const result = entries
      .filter(([_, d]) => d.lastPoint?.lat != null)
      .map(([id, deviceData]) => {
        const deviceMeta = listDevice.value.find(
          d => d.value === id || d.id === id
        )
        const rawPoints = deviceData.points
          .map(p => p.state.reported)
          .filter(p => p?.lat != null && p?.lng != null)
          .map(p => ({
            lat: p.lat,
            lng: p.lng,
            ignition: (p as any)[239]
          }))
        const cleanPoints = deviceData.points
          .map(p => p.state.reported)
          .filter(p => p?.lat != null)
          .map(p => [p.lat, p.lng] as [number, number])
        return {
          id,
          points: cleanPoints,
          rawPoints,
          name: deviceMeta?.name || 'Unidad',
          color: deviceMeta?.color || '#3b82f6',
          speed: deviceData.lastPoint?.sp ?? 0,
          status: deviceStatus.value[id] ?? 'sin-senal',
          stopTime: deviceData.totalStopHours,
          maxSpeed: deviceData.maxSpeed,
          avgSpeed: deviceData.avgSpeed,
          maxSpeedTime: deviceData.maxSpeedTime
            ? formatLocalDate(deviceData.maxSpeedTime)
            : '--',
          lastPoint: deviceData.lastPoint
            ? ([deviceData.lastPoint.lat, deviceData.lastPoint.lng] as [
                number,
                number
              ])
            : null,
          lastTime: deviceData.lastPoint
            ? formatLocalDate(deviceData.lastPoint.ts)
            : '--',
          lastCoords: deviceData.lastPoint
            ? `${deviceData.lastPoint.lat.toFixed(5)}, ${deviceData.lastPoint.lng.toFixed(5)}`
            : 'N/A',
          prevPoint: deviceData.prevPoint
            ? ([deviceData.prevPoint.lat, deviceData.prevPoint.lng] as [
                number,
                number
              ])
            : null,
          prevTime: deviceData.prevPoint
            ? formatLocalDate(deviceData.prevPoint.ts)
            : '--',
          prevCoords: deviceData.prevPoint
            ? `${deviceData.prevPoint.lat.toFixed(5)}, ${deviceData.prevPoint.lng.toFixed(5)}`
            : 'N/A'
        }
      })
    return result
  })

  const fetchDeviceData = async (options?: { showValidationAlert?: boolean, force?: boolean }) => {
    const showValidationAlert = options?.showValidationAlert ?? true
    const force = options?.force === true
    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationAlert) {
        toast.add({
          title: validation.message,
          icon: 'i-lucide-triangle-alert',
          color: 'error'
        })
      }
      return
    }

    const { devices, start, end } = validation
    const queryKey = buildDeviceRangeCacheKey(devices, start, end)

    if (shouldUsePiniaCache({
      force,
      hasData: Object.keys(allRoutes.value).length > 0,
      isFresh: store.isRouteCacheFresh(queryKey, MAP_ROUTE_PINIA_TTL_MS)
    })) {
      store.updateStatusesFromRoutes(allRoutes.value)
      updateCenterFromData(allRoutes.value)
      return
    }

    isLoading.value = true
    try {
      const response = await fetch('/api/map/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devices,
          start,
          end
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData?.message || 'No se pudo cargar la ruta de dispositivos.'
        toast.add({
          title: message,
          icon: 'i-lucide-triangle-alert',
          color: 'error'
        })
        return
      }

      const data = await response.json()
      allRoutes.value = data
      store.updateStatusesFromRoutes(data)
      store.setRouteCacheMeta(queryKey)
      updateCenterFromData(data)
    } finally {
      isLoading.value = false
    }
  }

  return { allRoutes, center, processedRoutes, isLoading, fetchDeviceData }
}
