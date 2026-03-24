import { and, eq } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { frontendBackendRouteLinks, moduleRoutes } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const routeId = Number(getRouterParam(event, 'id'))

  if (!routeId) {
    throw createError({ statusCode: 400, statusMessage: 'id invalido' })
  }

  const selectedRoute = await db.query.moduleRoutes.findFirst({
    where: eq(moduleRoutes.id, routeId)
  })

  if (!selectedRoute) {
    throw createError({ statusCode: 404, statusMessage: 'Ruta no encontrada' })
  }

  if (selectedRoute.tipoRuta === 'backend') {
    const rows = await db
      .select({ relatedRouteId: frontendBackendRouteLinks.frontendRouteId })
      .from(frontendBackendRouteLinks)
      .where(eq(frontendBackendRouteLinks.backendRouteId, routeId))

    return {
      selectedRouteType: 'backend' as const,
      relatedRouteIds: Array.from(new Set(rows.map(row => row.relatedRouteId)))
    }
  }

  const rows = await db
    .select({ relatedRouteId: frontendBackendRouteLinks.backendRouteId })
    .from(frontendBackendRouteLinks)
    .where(eq(frontendBackendRouteLinks.frontendRouteId, routeId))

  return {
    selectedRouteType: 'frontend' as const,
    relatedRouteIds: Array.from(new Set(rows.map(row => row.relatedRouteId)))
  }
})
