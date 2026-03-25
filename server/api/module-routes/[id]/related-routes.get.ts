// server/api/module-routes/[id]/related-routes.get.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (event) => {
  const routeId = Number(getRouterParam(event, 'id'))

  if (!routeId || isNaN(routeId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  try {
    // El servicio ahora se encarga de identificar el tipo y buscar las relaciones
    return await service.getRelatedRoutes(routeId)
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al obtener rutas relacionadas'
    })
  }
})