import { db } from '@nuxthub/db'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }
  const body = await readBody(event)
  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Body vacío' })
  }
  const service = new FleetEquipmentService(db)
  await service.updateAssignment(id, {
    ...(body.flotaId && { flotaId: Number(body.flotaId) }),
    ...(body.equipoId && { equipoId: Number(body.equipoId) }),
    ...(body.instaladoEl && { instaladoEl: new Date(body.instaladoEl) }),
    ...(body.retiradoEl && { retiradoEl: new Date(body.retiradoEl) })
  })
  return { success: true }
})