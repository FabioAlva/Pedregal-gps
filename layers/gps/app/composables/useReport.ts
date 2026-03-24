import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import useFilter from './useFilter'
import type { DeviceSpeedReport, StopPoint } from '../types/IUserReport'
import { useReportStore } from '../stores/useReportStore'
import { cacheMaxAgeFromPinia } from '../../server/utils/cache-max-age'
import { buildDeviceRangeCacheKey, shouldUsePiniaCache } from './usePiniaCacheGuard'

const MAP_DISTANCE_PINIA_TTL_MS = cacheMaxAgeFromPinia.mapDistance * 1000
const MAP_SPEED_PINIA_TTL_MS = cacheMaxAgeFromPinia.mapSpeed * 1000
const MAP_STOPS_PINIA_TTL_MS = cacheMaxAgeFromPinia.mapStops * 1000

export function useReport() {

  const isReportLoading = ref(false)
  const reportErrorMessage = ref('')

  const reportStore = useReportStore()
  const {
    distanceRawData,
    speedRawData,
    stopRawData
  } = storeToRefs(reportStore)
  const { validateFilters, getDeviceIds, listDevice } = useFilter()

  const findDeviceByGpsId = (gpsId: string) =>
    listDevice.value.find(device => device.value === gpsId)

  const getFetchErrorMessage = (error: unknown, fallback: string) => {
    const dataMessage = (error as any)?.data?.message
    const statusMessage = (error as any)?.statusMessage
    if (typeof dataMessage === 'string' && dataMessage.trim()) return dataMessage
    if (typeof statusMessage === 'string' && statusMessage.trim()) return statusMessage
    return fallback
  }

  const speedStats = computed(() => {
    return Object.entries(speedRawData.value).map(([id, report]) => {
      const device = findDeviceByGpsId(id)
      return {
        id,
        name: device?.name || `Unidad ${id.slice(-4)}`,
        color: device?.color || '#004571',
        maxSpeed: report.maxSpeed,
        avgSpeed: report.avgSpeed
      }
    })
  })

  const speedChartData = computed(() => { 
    const entries = Object.entries(speedRawData.value) as [string, DeviceSpeedReport][]
    if (!entries.length) return { data: [], categories: {} as Record<string, { name: string, color: string }> }

    const timeMap = new Map<number, Record<string, string | number>>()

    entries.forEach(([id, report]) => {
      const device = findDeviceByGpsId(id)
      const key = device?.name || id
      report.points.forEach((p) => {
        const ts = p.state.reported.ts
        if (!timeMap.has(ts)) timeMap.set(ts, { timestamp: ts })
        timeMap.get(ts)![key] = p.state.reported.sp
      })
    })

    const data = Array.from(timeMap.values())
      .sort((a, b) => (a.timestamp as number) - (b.timestamp as number))
      .map(row => ({
        ...row,
        time: import.meta.server
          ? '--'
          : new Intl.DateTimeFormat('es-PE', {
              timeZone: 'America/Lima',
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false
            }).format(new Date(row.timestamp as number))
      }))

    const categories: Record<string, { name: string, color: string }> = {}
    entries.forEach(([id]) => {
      const device = findDeviceByGpsId(id)
      const key = device?.name || id
      categories[key] = { name: key, color: device?.color || '#004571' }
    })

    return { data, categories }
  })

  const stopChartData = computed(() => {
    const entries = Object.entries(stopRawData.value)
    if (!entries.length) return { data: [] as Record<string, string | number>[], categories: {} as Record<string, { name: string, color: string }>, yAxis: [] as string[] }

    const yAxis = entries.map(([id]) => findDeviceByGpsId(id)?.name || id)
    const row: Record<string, string | number> = { name: 'Horas Parada' }

    entries.forEach(([id, points]) => {
      const key = findDeviceByGpsId(id)?.name || id
      row[key] = Number((points.reduce((acc, p) => acc + p.duration, 0)).toFixed(2))
    })

    const categories: Record<string, { name: string, color: string }> = {}
    entries.forEach(([id]) => {
      const device = findDeviceByGpsId(id)
      const key = device?.name || id
      categories[key] = { name: key, color: device?.color || '#004571' }
    })

    return { data: [row], categories, yAxis }
  })

  const distanceChartData = computed(() => {
    const entries = Object.entries(distanceRawData.value)
    if (!entries.length) return { data: [] as Record<string, string | number>[], categories: {} as Record<string, { name: string, color: string }>, yAxis: [] as string[] }

    const yAxis = entries.map(([id]) => findDeviceByGpsId(id)?.name || id)
    const row: Record<string, string | number> = { name: 'Kilómetros Recorridos' }

    entries.forEach(([id, km]) => {
      const key = findDeviceByGpsId(id)?.name || id
      row[key] = Number((km as number).toFixed(2))
    })

    const categories: Record<string, { name: string, color: string }> = {}
    entries.forEach(([id]) => {
      const device = findDeviceByGpsId(id)
      const key = device?.name || id
      categories[key] = { name: key, color: device?.color || '#34d399' }
    })

    return { data: [row], categories, yAxis }
  })

  const speedOption = computed(() => {
    const { data, categories } = speedChartData.value
    if (!data.length) return {}

    const keys = Object.keys(categories)

    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: { bottom: 0, textStyle: { color: 'var(--ui-text-muted)' } },
      backgroundColor: 'transparent',
      grid: { left: 40, right: 16, top: 16, bottom: 80 },
      dataset: { source: data },
      xAxis: {
        type: 'time',
        splitNumber: 10,
        axisLabel: {
          color: 'var(--ui-text-muted)'
        },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      dataZoom: [
        {
          type: 'inside',
          show: false
        },
        {
          show: false
        }
      ],
      yAxis: {
        type: 'value',
        axisLabel: { color: 'var(--ui-text-muted)', formatter: '{value} km/h' },
        splitLine: { lineStyle: { color: 'var(--ui-border)' } }
      },
      series: keys.map(key => ({
        name: key,
        type: 'line',
        smooth: true,
        connectNulls: true,
        dimensions: ['timestamp', key],
        tooltip: { valueFormatter: value => `${value} km/h` },
        itemStyle: { color: categories[key]!.color },
        areaStyle: { color: categories[key]!.color, opacity: 0.1 },
        lineStyle: { width: 2 },
        symbol: 'none'
      }))
    } satisfies ECOption
  })

  const stopOption = computed(() => {
    const { data, categories, yAxis } = stopChartData.value
    if (!data.length) return {}

    const row = data[0] as Record<string, any>
    const barData = yAxis.map((key: string) => ({
      value: row[key] ?? 0,
      itemStyle: {
        color: categories[key]?.color ?? '#004571',
        borderRadius: [0, 4, 4, 0]
      }
    }))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const first = params?.[0]
          if (!first) return ''
          return `<span style="color:${first.color}">●</span> ${first.name}: <b>${first.value} h</b>`
        }
      },
      legend: { show: false },
      backgroundColor: 'transparent',
      grid: { left: 16, right: 24, top: 8, bottom: 32, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: 'var(--ui-text-muted)', formatter: '{value} h' },
        splitLine: { lineStyle: { color: 'var(--ui-border)' } }
      },
      yAxis: {
        type: 'category',
        data: yAxis,
        axisLabel: { color: 'var(--ui-text-muted)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        name: 'Horas acumuladas',
        type: 'bar',
        data: barData,
        barMaxWidth: 32
      }]
    }
  })

  const distanceOption = computed(() => {
    const { data, categories, yAxis } = distanceChartData.value
    if (!data.length) return {}

    const row = data[0] as Record<string, any>
    const barData = yAxis.map((key: string) => ({
      value: row[key] ?? 0,
      itemStyle: {
        color: categories[key]?.color ?? '#34d399',
        borderRadius: [0, 4, 4, 0]
      }
    }))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const first = params?.[0]
          if (!first) return ''
          return `<span style="color:${first.color}">●</span> ${first.name}: <b>${first.value} km</b>`
        }
      },
      backgroundColor: 'transparent',
      legend: { show: false },
      grid: { left: 16, right: 24, top: 8, bottom: 32, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: 'var(--ui-text-muted)', formatter: '{value} km' },
        splitLine: { lineStyle: { color: 'var(--ui-border)' } }
      },
      yAxis: {
        type: 'category',
        data: yAxis,
        axisLabel: { color: 'var(--ui-text-muted)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        name: 'Kilometraje acumulado',
        type: 'bar',
        data: barData,
        barMaxWidth: 32
      }]
    }
  })

  const fetchDistanceData = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
    const showValidationMessage = options?.showValidationMessage ?? true
    const force = options?.force === true
    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationMessage) reportErrorMessage.value = validation.message
      return
    }

    const queryKey = buildDeviceRangeCacheKey(validation.devices, validation.start, validation.end)
    if (shouldUsePiniaCache({
      force,
      hasData: Object.keys(distanceRawData.value).length > 0,
      isFresh: reportStore.isDistanceCacheFresh(queryKey, MAP_DISTANCE_PINIA_TTL_MS)
    })) {
      return
    }

    const data = await $fetch<Record<string, number>>('/api/map/distance', {
      method: 'POST',
      body: {
        devices: validation.devices,
        start: validation.start,
        end: validation.end
      }
    })
    distanceRawData.value = data
    reportStore.setDistanceCacheMeta(queryKey)
  }

  const fetchSpeedData = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
    const showValidationMessage = options?.showValidationMessage ?? true
    const force = options?.force === true
    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationMessage) reportErrorMessage.value = validation.message
      return
    }

    const queryKey = buildDeviceRangeCacheKey(validation.devices, validation.start, validation.end)
    if (shouldUsePiniaCache({
      force,
      hasData: Object.keys(speedRawData.value).length > 0,
      isFresh: reportStore.isSpeedCacheFresh(queryKey, MAP_SPEED_PINIA_TTL_MS)
    })) {
      return
    }

    const data = await $fetch<Record<string, DeviceSpeedReport>>('/api/map/speed', {
      method: 'POST',
      body: {
        devices: validation.devices,
        start: validation.start,
        end: validation.end
      }
    })
    speedRawData.value = data
    reportStore.setSpeedCacheMeta(queryKey)
  }

  const fetchStopData = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
    const showValidationMessage = options?.showValidationMessage ?? true
    const force = options?.force === true
    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationMessage) reportErrorMessage.value = validation.message
      return
    }

    const queryKey = buildDeviceRangeCacheKey(validation.devices, validation.start, validation.end)
    if (shouldUsePiniaCache({
      force,
      hasData: Object.keys(stopRawData.value).length > 0,
      isFresh: reportStore.isStopCacheFresh(queryKey, MAP_STOPS_PINIA_TTL_MS)
    })) {
      return
    }

    const data = await $fetch<Record<string, StopPoint[]>>('/api/map/stops', {
      method: 'POST',
      body: {
        devices: validation.devices,
        start: validation.start,
        end: validation.end
      }
    })
    stopRawData.value = data
    reportStore.setStopCacheMeta(queryKey)
  }

  const fetchAllReports = async (options?: { showValidationMessage?: boolean, force?: boolean }) => {
    const showValidationMessage = options?.showValidationMessage ?? true
    const force = options?.force === true
    if (showValidationMessage) reportErrorMessage.value = ''
    const validation = validateFilters()
    if (!validation.isValid) {
      if (showValidationMessage) reportErrorMessage.value = validation.message
      return
    }

    const { devices, start, end } = validation

    isReportLoading.value = true
    try {
      await Promise.all([
        fetchSpeedData({ showValidationMessage, force }),
        fetchStopData({ showValidationMessage, force }),
        fetchDistanceData({ showValidationMessage, force })
      ])
      reportErrorMessage.value = ''
    } catch (error) {
      reportErrorMessage.value = getFetchErrorMessage(error, 'No se pudieron cargar los reportes GPS.')
    } finally {
      isReportLoading.value = false
    }
  }

  return {
    speedOption,
    stopOption,
    distanceOption,
    speedChartData,
    stopChartData,
    distanceChartData,
    speedStats,
    reportErrorMessage,
    isReportLoading,
    fetchSpeedData,
    fetchStopData,
    fetchAllReports,
    getDeviceIds
  }
}
