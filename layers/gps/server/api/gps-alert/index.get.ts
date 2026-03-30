import { db } from '@nuxthub/db'
import { GpsAlertService } from '../../services/GpsAlert/GpsAlert.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '~~/utils/cache-version'
import { cacheMaxAge } from '~~/utils/cache-max-age'

const getGpsAlertsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.gpsAlerts, cacheKeys.all())

    const service = new GpsAlertService(db)
    return await service.getAll()
  },
  {
    name: cacheNames.gpsAlerts,
    maxAge: cacheMaxAge.gpsAlerts,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async () => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.gpsAlerts, cacheKey)
  return await getGpsAlertsCached()
})