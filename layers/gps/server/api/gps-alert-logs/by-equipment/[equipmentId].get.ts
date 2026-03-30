import { db } from '@nuxthub/db'
import { GpsAlertLogService } from '../../../services/GpsAlertLog/GpsAlertLog.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '~~/utils/cache-version'
import { cacheMaxAge } from '~~/utils/cache-max-age'

const getGpsAlertLogsByEquipmentCached = defineCachedFunction(
  async (equipmentId: number) => {
    const cacheKey = cacheKeys.id(equipmentId)
    logCacheMiss(cacheNames.gpsAlertLogs, cacheKey, { equipmentId })
    const service = new GpsAlertLogService(db)
    return await service.getByEquipmentId(equipmentId)
  },
  {
    name: cacheNames.gpsAlertLogs,
    maxAge: cacheMaxAge.gpsAlertLogs,
    swr: true,
    getKey: (equipmentId: number) => cacheKeys.id(equipmentId)
  }
)

export default defineEventHandler(async (event) => {
  const equipmentId = getRouterParam(event, 'equipmentId')
  const parsedEquipmentId = Number(equipmentId)
  const cacheKey = cacheKeys.id(parsedEquipmentId)
  await logCacheHitIfPresent(cacheNames.gpsAlertLogs, cacheKey, { equipmentId: parsedEquipmentId })
  return await getGpsAlertLogsByEquipmentCached(parsedEquipmentId)
})