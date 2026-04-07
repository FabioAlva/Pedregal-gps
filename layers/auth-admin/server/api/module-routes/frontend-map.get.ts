// server/api/module-routes/frontend-map.get.ts
import { db } from '@nuxthub/db'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'

const frontendService = new ModuleRouteService(db)
export default defineEventHandler(async (event) => {
  try {
    const rules = await frontendService.getSortedFrontendRules()
    return rules
  } catch (error: any) {
    console.error('[API-FRONTEND-MAP] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno al generar el mapa de navegación'
    })
  }
})