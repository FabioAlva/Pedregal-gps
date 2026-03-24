import { getMapDataWithStats } from '../../services/Map/Map.service'
import { influxProvider } from '../../utils/influx'
import { cacheMaxAge } from '../../utils/cache-max-age'

type MapReportBody = {
  devices: string[]
  start: string
  end: string
}

const getMapRouteCached = defineCachedFunction(
  async (devices: string[], startISO: string, endISO: string) => {
    const client = influxProvider.client
    if (!client) {
      throw createError({ statusCode: 503, message: 'Influx no esta disponible en este momento.' })
    }

    return await getMapDataWithStats(client, devices, startISO, endISO)
  },
  {
    name: 'gps:map:route',
    maxAge: cacheMaxAge.mapRoute,
    swr: true,
    getKey: (devices: string[], startISO: string, endISO: string) => {
      const normalizedDevices = [...devices].sort().join(',')
      return `${normalizedDevices}:${startISO}:${endISO}`
    }
  }
)

export default defineEventHandler(async (event) => {
  const body = await readBody<MapReportBody>(event)

  if (!body.start || !body.end) {
    throw createError({ statusCode: 400, message: 'Debes enviar start y end para generar el reporte.' })
  }

  const start = new Date(body.start)
  const end = new Date(body.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError({ statusCode: 400, message: 'Formato de fecha invalido. Usa fechas ISO en start y end.' })
  }

  if (start >= end) {
    throw createError({ statusCode: 400, message: 'Rango de fechas invalido: start debe ser menor a end.' })
  }

  if (!Array.isArray(body.devices) || body.devices.length === 0) {
    throw createError({ statusCode: 400, message: 'Debes seleccionar al menos un dispositivo.' })
  }

  const devices = body.devices.map(device => String(device).trim()).filter(Boolean)
  if (!devices.length) {
    throw createError({ statusCode: 400, message: 'Debes seleccionar al menos un dispositivo valido.' })
  }

  try {
    return await getMapRouteCached(devices, start.toISOString(), end.toISOString())
  } catch (error: any) {
    if (error?.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Error en reporte de ruta.' })
  }
})
