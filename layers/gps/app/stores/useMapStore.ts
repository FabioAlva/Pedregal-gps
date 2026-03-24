import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useGpsRealtime } from '../composables/useGpsRealtime'
import type { MapDataForDevice } from '../types/IMap'

export const useMapStore = defineStore('map', () => {
  
  const allRoutes = ref<Record<string, MapDataForDevice>>({})
  const center = ref<[number, number]>([-5.1961, -80.6266])
  const lastRouteFetchAt = ref(0)
  const lastRouteQueryKey = ref('')
  const { telemetryData } = useGpsRealtime()
  const deviceStatus = ref<Record<string, 'online' | 'offline'>>({})
  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {}
  const OFFLINE_TIMEOUT_MS = 2 * 60 * 1000

  const setRouteCacheMeta = (queryKey: string) => {
    lastRouteQueryKey.value = queryKey
    lastRouteFetchAt.value = Date.now()
  }

  const isRouteCacheFresh = (queryKey: string, ttlMs: number) => {
    if (!lastRouteFetchAt.value || lastRouteQueryKey.value !== queryKey) return false
    return Date.now() - lastRouteFetchAt.value < ttlMs
  }

  const resetOfflineTimer = (deviceId: string) => {
    if (timeouts[deviceId]) clearTimeout(timeouts[deviceId])
    deviceStatus.value[deviceId] = 'online'
    timeouts[deviceId] = setTimeout(() => {
      deviceStatus.value[deviceId] = 'offline'
    }, OFFLINE_TIMEOUT_MS)
  }

  watch(telemetryData, (newRawData) => {
    if (!newRawData) return
    try {
      const payload = JSON.parse(typeof newRawData === 'string' ? newRawData : String(newRawData))
      if (payload.type === 'device:update') {
        const { deviceId, lat, lng, sp, ts, ang, alt } = payload
        resetOfflineTimer(deviceId)
        if (!allRoutes.value[deviceId]) {
          allRoutes.value[deviceId] = {
            points: [],
            totalStopHours: 0,
            maxSpeed: 0,
            avgSpeed: 0,
            maxSpeedTime: null,
            lastPoint: null,
            prevPoint: null
          }
        }

        const device = allRoutes.value[deviceId]
        if (!device) return

        if (device.lastPoint && ts <= device.lastPoint.ts) return

        device.prevPoint = device.lastPoint
        const newPoint = { lat, lng, ts, sp, ang: ang ?? 0, alt: alt ?? 0 }
        device.lastPoint = newPoint
        device.points.push({ state: { reported: newPoint } })

        if (sp > device.maxSpeed) {
          device.maxSpeed = sp
          device.maxSpeedTime = ts
        }
        device.avgSpeed = Number(
          ((device.avgSpeed * (device.points.length - 1) + sp) / device.points.length).toFixed(2)
        )
      }
    } catch (err) {
      console.error('Realtime stream error:', err)
    }
  })

  return {
    allRoutes,
    center,
    deviceStatus,
    lastRouteFetchAt,
    lastRouteQueryKey,
    setRouteCacheMeta,
    isRouteCacheFresh
  }
})
