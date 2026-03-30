import { db } from '@nuxthub/db'
import { FleetService } from "../../services/Fleet/Fleet.service"
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }
  const service = new FleetService(db)
  await service.updateFleet(id, body)
  return { success: true, message: 'Unidad actualizada y caché purgada' }
})