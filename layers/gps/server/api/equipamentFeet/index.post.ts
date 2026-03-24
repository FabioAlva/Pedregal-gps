// server/api/equipamentFeet/index.post.ts
import { db } from '@nuxthub/db'
import { NeonFleetEquipmentRepository } from '../../Repository/NeonFleetEquipmentRepository'
import { NeonEquipmentRepository } from '../../Repository/NeonEquipmentRepository'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.flotaId || !body.equipoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'flotaId y equipoId son obligatorios'
    })
  }



  const fleetRepo = new NeonFleetEquipmentRepository(db)
  const equipRepo = new NeonEquipmentRepository(db)
  const service = new FleetEquipmentService(fleetRepo, equipRepo)

  const result = await service.createAssignment({
    flotaId: Number(body.flotaId),
    equipoId: Number(body.equipoId),
    instaladoEl: body.instaladoEl ? new Date(body.instaladoEl) : new Date(),
    retiradoEl: null
  })

  await Promise.all([
    invalidateFunctionCacheByPrefix(cacheNames.fleetsAvailable),
    invalidateFunctionCacheByPrefix(cacheNames.fleetAssignmentsAll),
    invalidateFunctionCacheByPrefix(cacheNames.fleetAssignmentsActive)
  ])

  return { success: true, data: result }
})
