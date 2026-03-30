import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  if (!id || body.estadoId === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'ID y estadoId son requeridos' })
  }
  const service = new EquipmentService(db)
  await service.updateState(id, body.estadoId)
  return { success: true }
})