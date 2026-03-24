import { db } from '@nuxthub/db'
import { GeofenceStayInfluxService } from '../../services/GeofenceStay/GeofenceStayInflux.service'
import { influxProvider } from '../../utils/influx'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

type GeofenceStayReportBody = {
  start: string
  end: string
  devices: string[]
}

const getGeofenceStaysReportCached = defineCachedFunction(
  async (deviceIds: string[], startISO: string, endISO: string) => {
    const cacheKey = cacheKeys.geofenceStaysReport(deviceIds, startISO, endISO)
    logCacheMiss(cacheNames.geofenceStaysReport, cacheKey, {
      devicesCount: deviceIds.length,
      startISO,
      endISO
    })

    const client = influxProvider.client
    if (!client) {
      throw createError({
        statusCode: 503,
        message: 'Influx no esta disponible en este momento.'
      })
    }

    const service = new GeofenceStayInfluxService(db, client)
    return await service.getReport({
      start: new Date(startISO),
      end: new Date(endISO),
      deviceIds
    })
  },
  {
    name: cacheNames.geofenceStaysReport,
    maxAge: cacheMaxAge.geofenceStaysReport,
    swr: true,
    getKey: (deviceIds: string[], startISO: string, endISO: string) => {
      return cacheKeys.geofenceStaysReport(deviceIds, startISO, endISO)
    }
  }
)

const reportCachedHandler = defineEventHandler(async (event) => {
  const body = await readBody<GeofenceStayReportBody>(event)

  if (!body.start || !body.end) {
    throw createError({
      statusCode: 400,
      message: 'Debes enviar start y end para generar el reporte.'
    })
  }

  const start = new Date(body.start)
  const end = new Date(body.end)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'Formato de fecha invalido. Usa fechas ISO en start y end.'
    })
  }

  if (start >= end) {
    throw createError({
      statusCode: 400,
      message: 'Rango de fechas invalido: start debe ser menor a end.'
    })
  }

  if (!Array.isArray(body.devices) || body.devices.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Debes seleccionar al menos un dispositivo.'
    })
  }

  const deviceIds = body.devices.map(device => String(device).trim()).filter(Boolean)
  if (!deviceIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Debes seleccionar al menos un dispositivo valido.'
    })
  }

  try {
    const startISO = start.toISOString()
    const endISO = end.toISOString()
    const cacheKey = cacheKeys.geofenceStaysReport(deviceIds, startISO, endISO)

    await logCacheHitIfPresent(cacheNames.geofenceStaysReport, cacheKey, {
      devicesCount: deviceIds.length,
      startISO,
      endISO
    })

    return await getGeofenceStaysReportCached(deviceIds, startISO, endISO)
  } catch (error) {
    const err = error as any
    const message = typeof err?.message === 'string' ? err.message : 'Error desconocido'

    console.error('[geofence-stays/report] Error generando reporte', {
      message,
      start: body.start,
      end: body.end,
      devicesCount: deviceIds.length,
      devices: deviceIds
    })

    if ((error as any)?.statusCode) throw error

    const isInfluxFailure = /influx|telemetry|query|database|connection/i.test(message)
    throw createError({
      statusCode: isInfluxFailure ? 503 : 500,
      message: import.meta.dev
        ? `Error generando reporte de estadias por area: ${message}`
        : 'Error generando reporte de estadias por area.'
    })
  }
})

export default reportCachedHandler
