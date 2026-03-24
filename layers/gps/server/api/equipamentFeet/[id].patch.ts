// server/api/equipamentFeet/[id].patch.ts
import { db } from '@nuxthub/db'
import { NeonFleetEquipmentRepository } from '../../Repository/NeonFleetEquipmentRepository'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Body vacío' })
  }



  const repository = new NeonFleetEquipmentRepository(db)
  const service = new FleetEquipmentService(repository)

  await service.updateAssignment(id, {
    ...(body.flotaId && { flotaId: Number(body.flotaId) }),
    ...(body.equipoId && { equipoId: Number(body.equipoId) }),
    ...(body.instaladoEl && { instaladoEl: new Date(body.instaladoEl) }),
    ...(body.retiradoEl && { retiradoEl: new Date(body.retiradoEl) })
  })

  await Promise.all([
    invalidateFunctionCacheByPrefix(cacheNames.fleetsAvailable),
    invalidateFunctionCacheByPrefix(cacheNames.fleetAssignmentsAll),
    invalidateFunctionCacheByPrefix(cacheNames.fleetAssignmentsActive)
  ])

  return { success: true }
})
