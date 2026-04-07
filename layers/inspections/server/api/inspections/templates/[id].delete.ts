import { db } from '@nuxthub/db'
import { InspectionTemplateService } from '../../../services/InspectionTemplate/InspectionTemplate.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const service = new InspectionTemplateService(db)
  await service.delete(id)

  return { success: true }
})
