import { db } from '@nuxthub/db'
import { GpsAlertLogService } from '../../../services/GpsAlertLog/GpsAlertLog.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../../utils/cache-version'
import { cacheMaxAge } from '../../../utils/cache-max-age'

const getGpsAlertLogsByAlertCached = defineCachedFunction(
  async (alertaId: number) => {
    const cacheKey = cacheKeys.id(alertaId)
    logCacheMiss(cacheNames.gpsAlertLogs, cacheKey, { alertaId })
    const service = new GpsAlertLogService(db)
    return await service.getByAlertId(alertaId)
  },
  {
    name: cacheNames.gpsAlertLogs,
    maxAge: cacheMaxAge.gpsAlertLogs,
    swr: true,
    getKey: (alertaId: number) => cacheKeys.id(alertaId)
  }
)

export default defineEventHandler(async (event) => {
  const alertaId = getRouterParam(event, 'alertaId')
  const parsedAlertId = Number(alertaId)
  const cacheKey = cacheKeys.id(parsedAlertId)
  await logCacheHitIfPresent(cacheNames.gpsAlertLogs, cacheKey, { alertaId: parsedAlertId })
  return await getGpsAlertLogsByAlertCached(parsedAlertId)
})