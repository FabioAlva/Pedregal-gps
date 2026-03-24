import { EquipmentService } from '../../services/Equipment/Equipment.service'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import { neon } from '@neondatabase/serverless'
import type { NewEquipment } from '~~/shared/types/db'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const service = new EquipmentService(db)
  const data: NewEquipment = await readBody(event)
  const id = await service.registerDevice(data)
  await invalidateFunctionCacheByPrefix(cacheNames.equipmentList)
  setResponseStatus(event, 201)
  return { id }
})
