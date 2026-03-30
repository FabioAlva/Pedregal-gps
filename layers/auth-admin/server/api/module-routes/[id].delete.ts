import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id invalido' })
  }

  const service = new ModuleRouteService(db)
  await service.delete(id)
  return { success: true }
})
