import { db } from '@nuxthub/db'
import { FleetService } from "../../services/Fleet/Fleet.service"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido para eliminar' })
  }
  const service = new FleetService(db)
  await service.deleteFleet(id)
  
  return { success: true, message: 'Unidad eliminada correctamente' }
})