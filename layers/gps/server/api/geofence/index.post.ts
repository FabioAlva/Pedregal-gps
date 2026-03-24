import { db } from '@nuxthub/db'
import { GeofenceService } from '../../services/GeoFence/Geofence.service'
import type { NewGeofence } from '~~/shared/types/db'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {


  const service = new GeofenceService(db)
  const body: NewGeofence = await readBody(event)
  const id = await service.create(body)
  await Promise.all([
    invalidateFunctionCacheByPrefix(cacheNames.geofenceList),
    invalidateFunctionCacheByPrefix(cacheNames.geofenceStaysReport)
  ])
  setResponseStatus(event, 201)
  return { id }
})
