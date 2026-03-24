import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { frontendBackendRouteLinks, moduleRoutes } from '~~/server/db/schema'

interface ReplaceRelatedRoutesBody {
  relatedRouteIds?: number[]
}

export default defineEventHandler(async (event) => {
  const routeId = Number(getRouterParam(event, 'id'))
  const body = await readBody<ReplaceRelatedRoutesBody>(event)

  if (!routeId) {
    throw createError({ statusCode: 400, statusMessage: 'id invalido' })
  }

  const selectedRoute = await db.query.moduleRoutes.findFirst({
    where: eq(moduleRoutes.id, routeId)
  })

  if (!selectedRoute) {
    throw createError({ statusCode: 404, statusMessage: 'Ruta no encontrada' })
  }

  const uniqueRelatedIds = Array.from(
    new Set((body.relatedRouteIds ?? []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))
  )

  if (uniqueRelatedIds.length > 0) {
    const expectedType = selectedRoute.tipoRuta === 'backend' ? 'frontend' : 'backend'

    const existingRoutes = await db.query.moduleRoutes.findMany({
      where: and(
        inArray(moduleRoutes.id, uniqueRelatedIds),
        eq(moduleRoutes.tipoRuta, expectedType),
        eq(moduleRoutes.protegida, true)
      )
    })

    if (existingRoutes.length !== uniqueRelatedIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Una o mas rutas relacionadas no existen, no son del tipo esperado o no son protegidas'
      })
    }
  }

  if (selectedRoute.tipoRuta === 'backend') {
    await db.delete(frontendBackendRouteLinks)
      .where(eq(frontendBackendRouteLinks.backendRouteId, routeId))

    if (uniqueRelatedIds.length > 0) {
      await db.insert(frontendBackendRouteLinks).values(
        uniqueRelatedIds.map(frontendRouteId => ({
          frontendRouteId,
          backendRouteId: routeId
        }))
      )
    }
  } else {
    await db.delete(frontendBackendRouteLinks)
      .where(eq(frontendBackendRouteLinks.frontendRouteId, routeId))

    if (uniqueRelatedIds.length > 0) {
      await db.insert(frontendBackendRouteLinks).values(
        uniqueRelatedIds.map(backendRouteId => ({
          frontendRouteId: routeId,
          backendRouteId
        }))
      )
    }
  }

  return { success: true }
})
