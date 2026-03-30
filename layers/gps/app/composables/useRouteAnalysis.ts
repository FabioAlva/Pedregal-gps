import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import useFilter from './useFilter'
import { useRouteAnalysisStore } from '../stores/useRouteAnalysisStore'
import type { RouteAnalysisByDevice, RouteAnalysisSegment } from '../types/IRouteAnalysis'
import { cacheMaxAgeFromPinia } from '~~/utils/cache-max-age'
import { shouldUsePiniaCache, buildDeviceRangeCacheKey } from '~~/app/composables/usePiniaCacheGuard'

const ROUTE_ANALYSIS_PINIA_TTL_MS = cacheMaxAgeFromPinia.mapRouteAnalysis * 1000

interface RouteSegmentRow extends RouteAnalysisSegment {
  id: string
  deviceId: string
  deviceName: string
  deviceColor: string
}

export function useRouteAnalysis() {
  const store = useRouteAnalysisStore()
  const { report } = storeToRefs(store)
  const { validateFilters, listDevice } = useFilter()

  const isLoading = ref(false)
  const errorMessage = ref('')

  const getFetchErrorMessage = (error: unknown, fallback: string) => {
    const dataMessage = (error as any)?.data?.message
    const statusMessage = (error as any)?.statusMessage
    if (typeof dataMessage === 'string' && dataMessage.trim()) return dataMessage
    if (typeof statusMessage === 'string' && statusMessage.trim()) return statusMessage
    return fallback
  }

  const findDeviceByGpsId = (gpsId: string) =>
    listDevice.value.find(device => device.value === gpsId)

  const deviceSummaries = computed(() => {
    return Object.entries(report.value).map(([deviceId, data]) => {
      const device = findDeviceByGpsId(deviceId)
      return {
        deviceId,
        deviceName: device?.name || `Unidad ${deviceId.slice(-4)}`,
        deviceColor: device?.color || '#004571',
        ...data.summary
      }
    })
  })

  const rows = computed<RouteSegmentRow[]>(() => {
    const allRows: RouteSegmentRow[] = []

    Object.entries(report.value).forEach(([deviceId, data]) => {
      const device = findDeviceByGpsId(deviceId)
      const deviceName = device?.name || `Unidad ${deviceId.slice(-4)}`
      const deviceColor = device?.color || '#004571'

      data.segments.forEach((segment, index) => {
        allRows.push({
          ...segment,
          id: `${deviceId}-${index}-${segment.startTs}`,
          deviceId,
          deviceName,
          deviceColor
        })
      })
    })

    return allRows.sort((a, b) => b.startTs - a.startTs)
  })

  const rowsPreview = computed(() => rows.value.slice(0, 400))

  const downloadCsv = (filename: string, csvContent: string) => {
    if (import.meta.server) return

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const toCsvValue = (value: string | number) => {
    const str = String(value ?? '')
    return `"${str.replace(/"/g, '""')}"`
  }

  const exportRouteAnalysisCsv = () => {
    const headers = [
      'Auto',
      'GPS',
      'Punto Inicial',
      'Tiempo Inicial',
      'Velocidad Inicial (km/h)',
      'Punto Final',
      'Tiempo (i-f)',
      'Velocidad Final (km/h)',
      'Distancia (km)',
      'Brecha > 1h'
    ]

    const summaryHeaders = [
      'Auto',
      'GPS',
      'Segmentos',
      'Brechas <= 1h',
      '% <= 1h',
      'Brechas > 1h',
      '% > 1h',
      'Brecha Min',
      'Brecha Prom',
      'Brecha Max',
      'P95 Brecha'
    ]

    const summaryRows = deviceSummaries.value.map((item) => {
      const toHhmmss = (seconds: number) => {
        const total = Math.max(0, Math.floor(seconds))
        const hh = Math.floor(total / 3600)
        const mm = Math.floor((total % 3600) / 60)
        const ss = total % 60
        return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
      }

      return [
        item.deviceName,
        item.deviceId,
        item.totalSegments,
        item.gapsUpToOneHourCount,
        `${item.gapsUpToOneHourPct}%`,
        item.gapsOverOneHourCount,
        `${item.gapsOverOneHourPct}%`,
        toHhmmss(item.minGapSeconds),
        toHhmmss(item.avgGapSeconds),
        toHhmmss(item.maxGapSeconds),
        toHhmmss(item.p95GapSeconds)
      ]
    })

    const csvRows = rows.value.map((row) => {
      const startPoint = `${row.startLat.toFixed(6)}, ${row.startLng.toFixed(6)}`
      const endPoint = `${row.endLat.toFixed(6)}, ${row.endLng.toFixed(6)}`
      const startTime = new Date(row.startTs).toISOString()
      const tripTotal = Math.max(0, Math.floor(row.durationSeconds))
      const tripHh = Math.floor(tripTotal / 3600)
      const tripMm = Math.floor((tripTotal % 3600) / 60)
      const tripSs = tripTotal % 60
      const tripDuration = `${tripHh.toString().padStart(2, '0')}:${tripMm.toString().padStart(2, '0')}:${tripSs.toString().padStart(2, '0')}`

      return [
        row.deviceName,
        row.deviceId,
        startPoint,
        startTime,
        row.startSpeedKmh.toFixed(2),
        endPoint,
        tripDuration,
        row.endSpeedKmh.toFixed(2),
        row.distanceKm.toFixed(3),
        row.durationSeconds > 3600 ? 'Si' : 'No'
      ]
    })

    const content = [
      'RESUMEN DE BRECHAS POR AUTO',
      summaryHeaders.map(toCsvValue).join(','),
      ...summaryRows.map((columns) => columns.map(toCsvValue).join(',')),
      '',
      'DETALLE ENTRE PUNTOS GPS',
      headers.map(toCsvValue).join(','),
      ...csvRows.map((columns) => columns.map(toCsvValue).join(','))
    ].join('\n')

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    downloadCsv(`analisis_trayectos_${stamp}.csv`, content)
  }

  const fetchRouteAnalysis = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
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
      hasData: Object.keys(report.value).length > 0,
      isFresh: store.isCacheFresh(queryKey, ROUTE_ANALYSIS_PINIA_TTL_MS)
    })) {
      return
    }

    isLoading.value = true
    try {
      const data = await $fetch<RouteAnalysisByDevice>('/api/map/route-analysis', {
        method: 'POST',
        body: {
          devices,
          start,
          end
        }
      })
      report.value = data
      store.setCacheMeta(queryKey)
      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = getFetchErrorMessage(error, 'No se pudo cargar el analisis de trayectos.')
    } finally {
      isLoading.value = false
    }
  }

  return {
    report,
    rows,
    rowsPreview,
    deviceSummaries,
    isLoading,
    errorMessage,
    fetchRouteAnalysis,
    exportRouteAnalysisCsv
  }
}
