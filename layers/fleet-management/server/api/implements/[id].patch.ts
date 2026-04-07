import { db } from '@nuxthub/db'
import { ImplementService } from '../../services/Implement/Implement.service'

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

  if ('flotaId' in updates) {
    updates.flotaId = updates.flotaId ? Number(updates.flotaId) : null
  }

  const service = new ImplementService(db)
  await service.update(id, updates)

  return { success: true }
})
