import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'
import type { NewRole } from '~~/shared/types/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const method = event.method

  const service = new RoleService(db)

  if (method === 'GET') {
    return await service.getById(id)
  }

  if (method === 'PATCH') {
    const body: Partial<NewRole> = await readBody(event)
    await service.update(id, body)
    return { success: true }
  }

  if (method === 'DELETE') {
    await service.delete(id)
    return { success: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo no permitido' })
})
