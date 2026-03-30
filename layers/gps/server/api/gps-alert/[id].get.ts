import { db } from '@nuxthub/db'
import { GpsAlertService } from '../../services/GpsAlert/GpsAlert.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '~~/utils/cache-version'
import { cacheMaxAge } from '~~/utils/cache-max-age'

const getGpsAlertByIdCached = defineCachedFunction(
  async (id: number) => {
    const cacheKey = cacheKeys.id(id)
    logCacheMiss(cacheNames.gpsAlerts, cacheKey, { id })
    const service = new GpsAlertService(db)
    return await service.getById(id)
  },
  {
    name: cacheNames.gpsAlerts,
    maxAge: cacheMaxAge.gpsAlerts,
    swr: true,
    getKey: (id: number) => cacheKeys.id(id)
  }
)

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const alertId = Number(id)
  const cacheKey = cacheKeys.id(alertId)
  await logCacheHitIfPresent(cacheNames.gpsAlerts, cacheKey, { id: alertId })
  return await getGpsAlertByIdCached(alertId)
})