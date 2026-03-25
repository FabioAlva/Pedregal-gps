// server/api/module-routes/index.get.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'
import type { ModuleRouteView } from '~~/server/Repository/Interfaces/IModuleRouteRepository'

const service = new ModuleRouteService(db)

export default defineEventHandler(async (): Promise<ModuleRouteView[]> => {
  try {
 
    return await service.getAll()
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: 'Error al obtener el listado de rutas'
    })
  }
})