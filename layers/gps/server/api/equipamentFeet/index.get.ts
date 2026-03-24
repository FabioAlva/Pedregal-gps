// api/fleet-equipment/index.ts
import { db } from '@nuxthub/db'
import { NeonFleetEquipmentRepository } from '../../Repository/NeonFleetEquipmentRepository'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

const getAssignmentsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.fleetAssignmentsAll, cacheKeys.all())
    const repository = new NeonFleetEquipmentRepository(db)
    const service = new FleetEquipmentService(repository)
    return await service.getAllAssignments()
  },
  {
    name: cacheNames.fleetAssignmentsAll,
    maxAge: cacheMaxAge.fleetAssignmentsAll,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async (event) => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.fleetAssignmentsAll, cacheKey)
  return await getAssignmentsCached()
})
