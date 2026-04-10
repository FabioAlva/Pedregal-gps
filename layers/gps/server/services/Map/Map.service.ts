import type { DeviceSpeedReport } from '../../schemas/ISpeedReportPoint.js'
import type { MapRoutePoint } from '../../schemas/IMapRoutePoint.js'
import type { StopReportPoint } from '../../schemas/IStopReportPoint.js'
import type { RouteAnalysisByDevice, RouteAnalysisSegment } from '../../schemas/IRouteAnalysis.js'
import type { MapDataWithStatsResponse } from '../../schemas/IMapDataWithStatsResponse.js'
import { getInterval, getRouteInterval } from '../../utils/influx'
import { getDeviceFilter } from '../../utils/influx-sql'
import { distanceMeters } from '../../utils/geofence-geometry'
/**
 * Obtiene la telemetría base (Rutas)
 */

export const getRouteData = async (
  client: any,
  devices: string[],
  start: string,
  end: string
) => {
  const interval = getRouteInterval(start, end)

  const sql = `
      SELECT 
        DATE_BIN(INTERVAL '${interval}', time, '1970-01-01') AS time,
        device_id,
        selector_last(lat, time)['value']    AS lat, 
        selector_last(lng, time)['value']    AS lng,   
        selector_last(speed, time)['value']  AS speed, 
        selector_last(ang, time)['value']    AS ang,   
        selector_last(alt, time)['value']    AS alt,
        selector_last(p239, time)['value']   AS p239
      FROM telemetry
      WHERE time >= '${start}' AND time <= '${end}'
        AND device_id IN (${getDeviceFilter(devices)})
      GROUP BY 1, 2
      ORDER BY time ASC`

  const grouped: Record<string, MapRoutePoint[]> = {}
  for await (const row of client.query(sql)) {
    const id = row.device_id as string
    if (!grouped[id]) grouped[id] = []
    grouped[id].push({
      state: {
        reported: {
          lat: Number(row.lat),
          lng: Number(row.lng),
          ts: new Date(row.time).getTime(),
          sp: Number(row.speed || 0),
          ang: Number(row.ang || 0),
          alt: Number(row.alt || 0),
          239: row.p239 != null ? Number(row.p239) : undefined
        }
      }
    })
  }
  return grouped
}

/**
 * Kilometraje: Basado en el Odometro.
 */

export const getDistanceStats = async (
  client: any,
  devices: string[],
  start: string,
  end: string
): Promise<Record<string, number>> => {
  const sql = `
    WITH counter_diffs AS (
      SELECT
        device_id,
        GREATEST(
          p16 - LAG(p16) OVER (PARTITION BY device_id ORDER BY time),
          0
        ) AS distance
      FROM telemetry
      WHERE time >= '${start}' AND time <= '${end}'
        AND device_id IN (${getDeviceFilter(devices)})
    )
    SELECT
      device_id,
      SUM(distance) / 1000 AS total_distance
    FROM counter_diffs
    GROUP BY 1
    ORDER BY device_id
  `

  const distances: Record<string, number> = {}

  for await (const row of client.query(sql)) {
    const id = row.device_id as string
    distances[id] = Number(Number(row.total_distance ?? 0).toFixed(2))
  }
  return distances
}

/*
  Estadisticas de velocidad : Velocidad Maxima , velocidad Promedio , TimeStamp de la velocidad Maxima
*/

export const getSpeedStats = async (
  client: any,
  devices: string[],
  start: string,
  end: string
): Promise<
  Record<
    string,
    Pick<DeviceSpeedReport, 'maxSpeed' | 'avgSpeed' | 'maxSpeedTime'>
  >
> => {
  const sql = `
    WITH RankedStats AS (
      SELECT 
        device_id, speed, time,
        AVG(speed) OVER(PARTITION BY device_id) AS avg_speed,
        ROW_NUMBER() OVER(PARTITION BY device_id ORDER BY speed DESC, time DESC) AS rn
      FROM telemetry
      WHERE time >= '${start}' AND time <= '${end}'
        AND device_id IN (${getDeviceFilter(devices)})
    )
    SELECT device_id, speed AS max_speed, avg_speed, time AS max_speed_time
    FROM RankedStats WHERE rn = 1
  `

  const stats: Record<
    string,
    Pick<DeviceSpeedReport, 'maxSpeed' | 'avgSpeed' | 'maxSpeedTime'>
  > = {}

  for await (const row of client.query(sql)) {
    const id = row.device_id as string
    if (!id || id === 'undefined') {
      console.warn('Saltando fila sin device_id válido:', row.time)
      continue
    }
    stats[id] = {
      maxSpeed: Number(Number(row.max_speed).toFixed(2)),
      avgSpeed: Number(Number(row.avg_speed).toFixed(2)),
      maxSpeedTime: row.max_speed_time
    }
  }

  return stats
}

/**
 * Estadistica de Velocidades :  Puntos de serie temporal.
 */

export const getSpeedData = async (
  client: any,
  devices: string[],
  start: string,
  end: string
) => {
  const interval = getInterval(start, end)

  const sqlPoints = `
    SELECT 
      date_bin_gapfill(INTERVAL '${interval}', time, '1970-01-01') AS time,
      device_id,
    ROUND(interpolate(MAX(speed))::numeric, 2) AS speed
    FROM telemetry
    WHERE time >= '${start}' AND time <= '${end}'
      AND device_id IN (${getDeviceFilter(devices)})
    GROUP BY 1, 2
    ORDER BY time ASC
  `

  const stats = await getSpeedStats(client, devices, start, end)
  const speedData: Record<string, DeviceSpeedReport> = {}

  for (const [id, stat] of Object.entries(stats)) {
    speedData[id] = { points: [], ...stat }
  }

  for await (const row of client.query(sqlPoints)) {
    const id = row.device_id as string
    if (!id || id === 'undefined') continue
    if (!speedData[id])
      speedData[id] = { points: [], maxSpeed: 0, avgSpeed: 0 }
    speedData[id].points.push({
      state: {
        reported: { ts: new Date(row.time).getTime(), sp: Number(row.speed) }
      }
    })
  }
  return speedData
}

/*
 Reporte de Paradas: Calcula duración cuando sp < 3.
 */

export const getStopData = async (
  client: any,
  devices: string[],
  start: string,
  end: string,
  maxStopSeconds: number = 30 * 60
) => {
  const sql = `
  WITH time_and_diffs AS (
    SELECT 
      device_id,
      COALESCE(
        EXTRACT(EPOCH FROM (time - LAG(time) OVER (PARTITION BY device_id ORDER BY time))),
        0
      ) AS time_delta_seconds,
      GREATEST(
        p16 - LAG(p16) OVER (PARTITION BY device_id ORDER BY time), 
        0
      ) AS distance
    FROM telemetry
    WHERE time >= '${start}' AND time <= '${end}'
      AND device_id IN (${getDeviceFilter(devices)})
  )
  SELECT
    device_id,
    SUM(CASE 
      WHEN distance = 0
       AND time_delta_seconds BETWEEN 1 AND ${maxStopSeconds}
      THEN time_delta_seconds ELSE 0 
    END) AS segundos_detenido  
  FROM time_and_diffs
  GROUP BY device_id
  ORDER BY device_id ASC
  `

  const stopData: Record<string, StopReportPoint[]> = {}
  for await (const row of client.query(sql)) {
    const id = row.device_id as string
    stopData[id] = [
      {
        duration: Number(
          Number((row.segundos_detenido || 0) / 3600).toFixed(2)
        )
      }
    ]
  }
  return stopData
}

const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180

  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

const normalizeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getPercent = (value: number, total: number) => {
  if (total <= 0) return 0
  return Number(((value / total) * 100).toFixed(2))
}

const percentile = (sortedValues: number[], p: number) => {
  if (!sortedValues.length) return 0
  const clamped = Math.max(0, Math.min(100, p))
  const index = Math.ceil((clamped / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))] ?? 0
}

/**
 * Analisis de trayectos entre cada punto GPS.
 */
export const getRouteAnalysisData = async (
  client: any,
  devices: string[],
  start: string,
  end: string,
  maxIdleSeconds: number = 30 * 60
): Promise<RouteAnalysisByDevice> => {
  const interval = getInterval(start, end)

  const sql = `
    SELECT
      DATE_BIN(INTERVAL '${interval}', time, '1970-01-01') AS time,
      device_id,
      selector_last(lat, time)['value']   AS lat,
      selector_last(lng, time)['value']   AS lng,
      selector_last(speed, time)['value'] AS speed,
      selector_last(p16, time)['value']   AS p16
    FROM telemetry
    WHERE time >= '${start}' AND time <= '${end}'
      AND device_id IN (${getDeviceFilter(devices)})
    GROUP BY 1, 2
    ORDER BY device_id ASC, time ASC
  `

  const grouped: Record<string, {
    ts: number
    lat: number
    lng: number
    speed: number
    odometer: number
  }[]> = {}

  for await (const row of client.query(sql)) {
    const id = row.device_id as string
    const ts = new Date(row.time).getTime()

    if (!id || Number.isNaN(ts)) continue

    const lat = normalizeNumber(row.lat)
    const lng = normalizeNumber(row.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    if (!grouped[id]) grouped[id] = []
    grouped[id].push({
      ts,
      lat,
      lng,
      speed: normalizeNumber(row.speed),
      odometer: normalizeNumber(row.p16)
    })
  }

  const result: RouteAnalysisByDevice = {}

  devices.forEach((deviceId) => {
    const points = grouped[deviceId] ?? []
    const segments: RouteAnalysisSegment[] = []
    const gapsSeconds: number[] = []

    let totalDistanceKm = 0
    let totalIdleSeconds = 0
    let totalMovingSeconds = 0
    let maxSegmentDistanceKm = 0

    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1]!
      const current = points[i]!

      const durationSeconds = Math.max(0, Math.floor((current.ts - prev.ts) / 1000))
      if (durationSeconds <= 0) continue
      gapsSeconds.push(durationSeconds)

      const odometerDiffMeters = current.odometer - prev.odometer
      const odometerDistanceKm = odometerDiffMeters > 0 ? odometerDiffMeters / 1000 : 0

      const geoDistanceKm = haversineDistanceKm(prev.lat, prev.lng, current.lat, current.lng)

      const distanceKm = Number(
        Math.max(0, odometerDistanceKm > 0 ? odometerDistanceKm : geoDistanceKm).toFixed(4)
      )

      const isIdle = distanceKm === 0 && durationSeconds >= 1 && durationSeconds <= maxIdleSeconds
      const idleSeconds = isIdle ? durationSeconds : 0

      if (isIdle) {
        totalIdleSeconds += idleSeconds
      } else {
        totalMovingSeconds += durationSeconds
      }

      totalDistanceKm += distanceKm
      maxSegmentDistanceKm = Math.max(maxSegmentDistanceKm, distanceKm)

      segments.push({
        startTs: prev.ts,
        endTs: current.ts,
        startLat: prev.lat,
        startLng: prev.lng,
        endLat: current.lat,
        endLng: current.lng,
        durationSeconds,
        distanceKm,
        startSpeedKmh: Number(prev.speed.toFixed(2)),
        endSpeedKmh: Number(current.speed.toFixed(2)),
        idleSeconds,
        isIdle
      })
    }

    const totalDurationSeconds = Math.max(0, totalIdleSeconds + totalMovingSeconds)
    const avgMovingSpeedKmh = totalMovingSeconds > 0
      ? Number((totalDistanceKm / (totalMovingSeconds / 3600)).toFixed(2))
      : 0

    const sortedGaps = [...gapsSeconds].sort((a, b) => a - b)
    const oneHourSeconds = 3600
    const gapsOverOneHourCount = gapsSeconds.filter(value => value > oneHourSeconds).length
    const gapsUpToOneHourCount = gapsSeconds.length - gapsOverOneHourCount
    const gapSum = gapsSeconds.reduce((acc, value) => acc + value, 0)

    result[deviceId] = {
      summary: {
        totalPoints: points.length,
        totalSegments: segments.length,
        totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
        totalIdleSeconds,
        totalMovingSeconds,
        totalDurationSeconds,
        avgMovingSpeedKmh,
        maxSegmentDistanceKm: Number(maxSegmentDistanceKm.toFixed(2)),
        gapsUpToOneHourCount,
        gapsOverOneHourCount,
        gapsUpToOneHourPct: getPercent(gapsUpToOneHourCount, gapsSeconds.length),
        gapsOverOneHourPct: getPercent(gapsOverOneHourCount, gapsSeconds.length),
        minGapSeconds: sortedGaps[0] ?? 0,
        maxGapSeconds: sortedGaps[sortedGaps.length - 1] ?? 0,
        avgGapSeconds: gapsSeconds.length ? Number((gapSum / gapsSeconds.length).toFixed(2)) : 0,
        p95GapSeconds: percentile(sortedGaps, 95)
      },
      segments
    }
  })

  return result
}

/*
Orquestador principal para el Mapa y Dashboard.
*/

export const getMapDataWithStats = async (
  client: any,
  devices: string[],
  start: string,
  end: string
): Promise<MapDataWithStatsResponse> => {
  const [routes, stops, speeds] = await Promise.all([
    getRouteData(client, devices, start, end),
    getStopData(client, devices, start, end),
    getSpeedData(client, devices, start, end)
  ])

  const finalData: MapDataWithStatsResponse = {}
  devices.forEach((id) => {
    const devicePoints = routes[id] || []
    finalData[id] = {
      points: devicePoints,
      totalStopHours: Number(
        (stops[id]?.reduce((acc, s) => acc + s.duration, 0) || 0).toFixed(2)
      ),
      maxSpeed: speeds[id]?.maxSpeed || 0,
      avgSpeed: speeds[id]?.avgSpeed || 0,
      maxSpeedTime: speeds[id]?.maxSpeedTime || null,
      lastPoint: devicePoints[devicePoints.length - 1]?.state.reported ?? null,
      prevPoint: devicePoints[devicePoints.length - 2]?.state.reported ?? null
    }
  })
  return finalData
}
