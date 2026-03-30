// server/api/module-routes/[id]/frontend-links.get.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (event) => {
  const backendId = Number(getRouterParam(event, 'id'))

  if (!backendId || isNaN(backendId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de ruta backend inválido' })
  }

  try {
    // 1. Validamos que exista (dentro del service) y obtenemos los IDs vinculados
    const frontendRouteIds = await service.getLinkedFrontendIds(backendId)

    return {
      frontendRouteIds
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Error al obtener enlaces de rutas'
    })
  }
})