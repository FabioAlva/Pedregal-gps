// server/api/module-routes/index.post.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const id = await service.create(body)
    setResponseStatus(event, 201)
    return { id }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al crear la ruta del módulo'
    })
  }
})