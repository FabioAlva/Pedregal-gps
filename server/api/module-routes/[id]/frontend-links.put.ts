import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { frontendBackendRouteLinks, moduleRoutes } from '~~/server/db/schema'

interface ReplaceFrontendLinksBody {
  frontendRouteIds?: number[]
}

export default defineEventHandler(async (event) => {
  const backendRouteId = Number(getRouterParam(event, 'id'))
  const body = await readBody<ReplaceFrontendLinksBody>(event)

  if (!backendRouteId) {
    throw createError({ statusCode: 400, statusMessage: 'id invalido' })
  }

  const backendRoute = await db.query.moduleRoutes.findFirst({
    where: and(eq(moduleRoutes.id, backendRouteId), eq(moduleRoutes.tipoRuta, 'backend'))
  })

  if (!backendRoute) {
    throw createError({ statusCode: 404, statusMessage: 'Ruta backend no encontrada' })
  }

  const uniqueFrontendIds = Array.from(
    new Set((body.frontendRouteIds ?? []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))
  )

  if (uniqueFrontendIds.length > 0) {
    const existingFrontendRoutes = await db.query.moduleRoutes.findMany({
      where: and(
        inArray(moduleRoutes.id, uniqueFrontendIds),
        eq(moduleRoutes.tipoRuta, 'frontend'),
        eq(moduleRoutes.protegida, true)
      )
    })

    if (existingFrontendRoutes.length !== uniqueFrontendIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Una o mas rutas frontend no existen o no son protegidas'
      })
    }
  }

  await db.delete(frontendBackendRouteLinks)
    .where(eq(frontendBackendRouteLinks.backendRouteId, backendRouteId))

  if (uniqueFrontendIds.length > 0) {
    await db.insert(frontendBackendRouteLinks).values(
      uniqueFrontendIds.map(frontendRouteId => ({
        frontendRouteId,
        backendRouteId
      }))
    )
  }

  return { success: true }
})
