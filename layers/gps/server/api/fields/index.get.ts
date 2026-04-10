import { db } from '@nuxthub/db'
import { FieldService } from '../../services/Field/Field.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '~~/utils/cache-version'
import { cacheMaxAge } from '../../../../../utils/cache-max-age'

const getFieldsCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.fieldsList, cacheKeys.all())

    const service = new FieldService(db)
    return await service.getAll()
  },
  {
    name: cacheNames.fieldsList,
    maxAge: cacheMaxAge.fieldsList,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async () => {
  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.fieldsList, cacheKey)
  return await getFieldsCached()
})
