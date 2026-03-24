import { db } from '@nuxthub/db'
import { GpsAlertService } from '../../services/GpsAlert/GpsAlert.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const service = new GpsAlertService(db)
  const created = await service.create(body)
  await invalidateFunctionCacheByPrefix(cacheNames.gpsAlerts)
  return created
})