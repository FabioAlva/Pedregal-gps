import { db } from '@nuxthub/db'
import { GpsAlertLogService } from '../../services/GpsAlertLog/GpsAlertLog.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '~~/utils/cache-version'
import { cacheMaxAge } from '~~/utils/cache-max-age'

const getGpsAlertLogByIdCached = defineCachedFunction(
  async (id: number) => {
    const cacheKey = cacheKeys.id(id)
    logCacheMiss(cacheNames.gpsAlertLogs, cacheKey, { id })
    const service = new GpsAlertLogService(db)
    return await service.getById(id)
  },
  {
    name: cacheNames.gpsAlertLogs,
    maxAge: cacheMaxAge.gpsAlertLogs,
    swr: true,
    getKey: (id: number) => cacheKeys.id(id)
  }
)

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const logId = Number(id)
  const cacheKey = cacheKeys.id(logId)
  await logCacheHitIfPresent(cacheNames.gpsAlertLogs, cacheKey, { id: logId })
  return await getGpsAlertLogByIdCached(logId)
})