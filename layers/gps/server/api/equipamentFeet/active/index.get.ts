import { db } from '@nuxthub/db'
import { NeonFleetEquipmentRepository } from '../../../Repository/NeonFleetEquipmentRepository'
import { FleetEquipmentService } from '../../../services/FleetEquipment/FleetEquipment.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../../utils/cache-version'
import { cacheMaxAge } from '../../../utils/cache-max-age'

const getActiveAssignmentsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.fleetAssignmentsActive, cacheKeys.all())
    const repository = new NeonFleetEquipmentRepository(db)
    const service = new FleetEquipmentService(repository)
    return await service.getActiveAssignments()
  },
  {
    name: cacheNames.fleetAssignmentsActive,
    maxAge: cacheMaxAge.fleetAssignmentsActive,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async () => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.fleetAssignmentsActive, cacheKey)
  return await getActiveAssignmentsCached()
})
