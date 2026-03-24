import { db } from '@nuxthub/db'
import { GpsAlertLogService } from '../../services/GpsAlertLog/GpsAlertLog.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

const getGpsAlertLogsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.gpsAlertLogs, cacheKeys.all())
    const service = new GpsAlertLogService(db)
    return await service.getAll()
  },
  {
    name: cacheNames.gpsAlertLogs,
    maxAge: cacheMaxAge.gpsAlertLogs,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async () => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.gpsAlertLogs, cacheKey)
  return await getGpsAlertLogsCached()
})