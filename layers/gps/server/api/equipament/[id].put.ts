// server/api/equipament/[id].put.ts

import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {

  /* Se captura el ID y el cuerpo de la solicitud y se valida */
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  if (!id || !body.estadoId) {
    throw createError({ statusCode: 400, statusMessage: 'ID y estadoId son requeridos' })
  }
  
  /* Se instancia el servicio de equipos, se actualiza el estado y se invalida la cache */
  const service = new EquipmentService(db)
  await service.updateState(id, body.estadoId)
  await invalidateFunctionCacheByPrefix(cacheNames.equipmentList)

  return { success: true, message: 'Estado actualizado correctamente' }
})
