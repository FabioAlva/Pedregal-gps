import { db } from '@nuxthub/db'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.flotaId || !body.equipoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'flotaId y equipoId son obligatorios'
    })
  }
  const service = new FleetEquipmentService(db)
  const result = await service.createAssignment({
    flotaId: Number(body.flotaId),
    equipoId: Number(body.equipoId),
    instaladoEl: body.instaladoEl ? new Date(body.instaladoEl) : new Date(),
    retiradoEl: null
  })
  return { success: true, data: result }
})