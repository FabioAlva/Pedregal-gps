import { db } from '@nuxthub/db'
import { InspectionTemplateService } from '../../../services/InspectionTemplate/InspectionTemplate.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cuerpo de peticion vacio' })
  }

  const updates: any = { ...body }

  const service = new InspectionTemplateService(db)
  await service.update(id, updates)

  return { success: true }
})
