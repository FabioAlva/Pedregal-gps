import { db } from '@nuxthub/db'
import { GeofenceService } from '../../services/GeoFence/Geofence.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

const getGeofencesCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.geofenceList, cacheKeys.all())

    const service = new GeofenceService(db)
    return await service.getAll()
  },
  {
    name: cacheNames.geofenceList,
    maxAge: cacheMaxAge.geofenceList,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async (event) => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.geofenceList, cacheKey)
  return await getGeofencesCached()
})
