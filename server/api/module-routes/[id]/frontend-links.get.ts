import { and, eq } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { frontendBackendRouteLinks, moduleRoutes } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const backendRouteId = Number(getRouterParam(event, 'id'))

  if (!backendRouteId) {
    throw createError({ statusCode: 400, statusMessage: 'id invalido' })
  }

  const backendRoute = await db.query.moduleRoutes.findFirst({
    where: and(eq(moduleRoutes.id, backendRouteId), eq(moduleRoutes.tipoRuta, 'backend'))
  })

  if (!backendRoute) {
    throw createError({ statusCode: 404, statusMessage: 'Ruta backend no encontrada' })
  }

  const rows = await db
    .select({ frontendRouteId: frontendBackendRouteLinks.frontendRouteId })
    .from(frontendBackendRouteLinks)
    .where(eq(frontendBackendRouteLinks.backendRouteId, backendRouteId))

  return {
    frontendRouteIds: Array.from(new Set(rows.map(row => row.frontendRouteId)))
  }
})
