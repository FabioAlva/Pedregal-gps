// server/api/roles/[id].ts
import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'

const service = new RoleService(db)

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const method = event.method.toUpperCase()

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de rol inválido' })
  }

  try {
    switch (method) {
      case 'GET':
        return await service.getById(id)

      case 'PATCH':
        const body = await readBody(event)
        await service.update(id, body)
        return { success: true }

      case 'DELETE':
        await service.delete(id)
        return { success: true }

      default:
        throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error interno en la gestión de roles'
    })
  }
})