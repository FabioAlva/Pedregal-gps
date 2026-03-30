import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de equipo inválido' })
  }

  const body = await readBody(event)

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Cuerpo de petición vacío' })
  }

  const service = new EquipmentService(db)
  
  try {
    await service.update(id, body)
    return { success: true, message: 'Equipo actualizado correctamente' }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error interno al actualizar el equipo'
    })
  }
})