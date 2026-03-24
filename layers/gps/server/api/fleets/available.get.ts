import { db } from '@nuxthub/db'
import { NeonFleetRepository } from '../../Repository/NeonFleetRepository'
import { FleetService } from '../../services/Fleet/Fleet.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

const getAvailableFleetsCached = defineCachedFunction(
  async (includePlate: string | undefined) => {
    const cacheKey = cacheKeys.fleetsAvailable(includePlate)
    logCacheMiss(cacheNames.fleetsAvailable, cacheKey, { includePlate: includePlate ?? null })

    const service = new FleetService(new NeonFleetRepository(db))
    return await service.getAvailableFleets(includePlate)
  },
  {
    name: cacheNames.fleetsAvailable,
    maxAge: cacheMaxAge.fleetsAvailable,
    swr: true,
    getKey: (includePlate: string | undefined) => {
      return cacheKeys.fleetsAvailable(includePlate)
    }
  }
)

export default defineEventHandler(async (event) => {
  const { includePlate } = getQuery(event)
  const safeIncludePlate = typeof includePlate === 'string' ? includePlate : undefined
  const cacheKey = cacheKeys.fleetsAvailable(safeIncludePlate)

  await logCacheHitIfPresent(cacheNames.fleetsAvailable, cacheKey, {
    includePlate: safeIncludePlate ?? null
  })

  return await getAvailableFleetsCached(safeIncludePlate)
})
