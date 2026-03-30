// server/api/module-routes/[id]/frontend-links.put.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (event) => {
  const backendId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ frontendRouteIds?: number[] }>(event)

  if (!backendId || isNaN(backendId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de ruta backend inválido' })
  }

  // 1. Limpiamos IDs (Esto es lo único que el controlador "procesa")
  const uniqueIds = Array.from(new Set((body.frontendRouteIds ?? []).map(Number).filter(id => id > 0)))

  try {
    // 2. Usamos el método universal del Service
    await service.updateRelatedRoutes(backendId, uniqueIds)
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al actualizar enlaces'
    })
  }
})