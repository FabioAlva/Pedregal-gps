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

const getBasicFleetsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.fleetsBasic, cacheKeys.all())
    const service = new FleetService(new NeonFleetRepository(db))
    return await service.getBasicFleets()
  },
  {
    name: cacheNames.fleetsBasic,
    maxAge: cacheMaxAge.fleetsBasic,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async () => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.fleetsBasic, cacheKey)
  return await getBasicFleetsCached()
})
