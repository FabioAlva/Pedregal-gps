// server/api/module-routes/index.get.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'
import type { ModuleRoute } from '~~/shared/types/db'
const service = new ModuleRouteService(db)

export default defineEventHandler(async (): Promise<ModuleRoute[]> => {
  try {
 
    return await service.getAll()
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: 'Error al obtener el listado de rutas'
    })
  }
})