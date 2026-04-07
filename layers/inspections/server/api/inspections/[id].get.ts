import { db } from '@nuxthub/db'
import { InspectionService } from '../../services/Inspection/Inspection.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const service = new InspectionService(db)
  const inspection = await service.getById(id)

  if (!inspection) {
    throw createError({ statusCode: 404, statusMessage: 'Inspeccion no encontrada' })
  }

  return inspection
})
