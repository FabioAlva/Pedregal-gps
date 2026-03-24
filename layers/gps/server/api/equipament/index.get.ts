import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'
import {
  cacheKeys,
  cacheNames,
  logCacheHitIfPresent,
  logCacheMiss
} from '../../utils/cache-version'
import { cacheMaxAge } from '../../utils/cache-max-age'

/*Funcion para obtener la lista de equipos con caching */
const getEquipmentCached = defineCachedFunction(
  async () => {
    logCacheMiss(cacheNames.equipmentList, cacheKeys.all())
    const service = new EquipmentService(db)
    return await service.getAll()
  },
  {
    name: cacheNames.equipmentList,
    maxAge: cacheMaxAge.equipmentList,
    swr: true,
    getKey: () => cacheKeys.all()
  }
)

export default defineEventHandler(async (event) => {

  const cacheKey = cacheKeys.all()
  await logCacheHitIfPresent(cacheNames.equipmentList, cacheKey)
  return await getEquipmentCached()

})
