import { db } from '@nuxthub/db'
import { GpsAlertLogService } from '../../services/GpsAlertLog/GpsAlertLog.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const service = new GpsAlertLogService(db)
  const created = await service.register(body)
  await invalidateFunctionCacheByPrefix(cacheNames.gpsAlertLogs)
  return created
})