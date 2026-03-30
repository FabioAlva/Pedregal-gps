import { db } from '@nuxthub/db'
import { GpsAlertService } from '../../services/GpsAlert/GpsAlert.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const service = new GpsAlertService(db)
  await service.delete(Number(id))
  await invalidateFunctionCacheByPrefix(cacheNames.gpsAlerts)
  return { success: true }
})