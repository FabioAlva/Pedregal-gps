// server/api/module-routes/[id]/related-routes.put.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (event) => {
  const routeId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ relatedRouteIds?: number[] }>(event)

  if (!routeId || isNaN(routeId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  // Normalización básica de IDs
  const uniqueIds = Array.from(new Set((body.relatedRouteIds ?? []).map(Number).filter(id => id > 0)))

  try {
    // El servicio decide qué borrar y qué insertar según el tipo de la ruta original
    await service.updateRelatedRoutes(routeId, uniqueIds)
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al actualizar rutas relacionadas'
    })
  }
})