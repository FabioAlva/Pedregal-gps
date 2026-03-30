import { db } from '@nuxthub/db'
import { GeofenceService } from '../../services/GeoFence/Geofence.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const method = event.method

  const service = new GeofenceService(db)

  if (method === 'PATCH') {
    const body = await readBody(event)
    await service.update(id, body)
    await Promise.all([
      invalidateFunctionCacheByPrefix(cacheNames.geofenceList),
      invalidateFunctionCacheByPrefix(cacheNames.geofenceStaysReport)
    ])
    return { success: true }
  }

  if (method === 'DELETE') {
    await service.delete(id)
    await Promise.all([
      invalidateFunctionCacheByPrefix(cacheNames.geofenceList),
      invalidateFunctionCacheByPrefix(cacheNames.geofenceStaysReport)
    ])
    return { success: true }
  }
})
