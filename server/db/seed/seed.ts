import { db } from "@nuxthub/db";
import { frontendBackendRouteLinks, moduleRoutes, roleRoutePermissions, roles } from '../schema'
import { eq } from 'drizzle-orm'
import { seedModuleRoutes } from './section-routes.seed'

type RouteKey = {
  url: string
  tipoRuta: string
  metodo: string | null
}

const preserveRolePermissions = true

const keyForRoute = (route: RouteKey) => `${route.tipoRuta}|${route.url}|${route.metodo ?? ''}`

const existingRoutes = await db.select({
  id: moduleRoutes.id,
  url: moduleRoutes.url,
  tipoRuta: moduleRoutes.tipoRuta,
  metodo: moduleRoutes.metodo
}).from(moduleRoutes)

const routeById = new Map(existingRoutes.map(route => [route.id, route]))

const existingPermissions = await db.select({
  rolId: roleRoutePermissions.rolId,
  rutaModuloId: roleRoutePermissions.rutaModuloId,
  ver: roleRoutePermissions.ver,
  agregar: roleRoutePermissions.agregar,
  editar: roleRoutePermissions.editar,
  eliminar: roleRoutePermissions.eliminar
}).from(roleRoutePermissions)

const permissionsSnapshot = existingPermissions
  .map(permission => {
    const route = routeById.get(permission.rutaModuloId)
    if (!route) return null
    return {
      rolId: permission.rolId,
      url: route.url,
      tipoRuta: route.tipoRuta,
      metodo: route.metodo,
      ver: permission.ver,
      agregar: permission.agregar,
      editar: permission.editar,
      eliminar: permission.eliminar
    }
  })
  .filter(Boolean) as Array<{
    rolId: number
    url: string
    tipoRuta: string
    metodo: string | null
    ver: boolean
    agregar: boolean
    editar: boolean
    eliminar: boolean
  }>

const existingLinks = await db.select({
  frontendRouteId: frontendBackendRouteLinks.frontendRouteId,
  backendRouteId: frontendBackendRouteLinks.backendRouteId
}).from(frontendBackendRouteLinks)

const linksSnapshot = existingLinks
  .map(link => {
    const frontendRoute = routeById.get(link.frontendRouteId)
    const backendRoute = routeById.get(link.backendRouteId)
    if (!frontendRoute || !backendRoute) return null
    return {
      frontendUrl: frontendRoute.url,
      backendUrl: backendRoute.url,
      backendMethod: backendRoute.metodo ?? null
    }
  })
  .filter(Boolean) as Array<{
    frontendUrl: string
    backendUrl: string
    backendMethod: string | null
  }>

await db.delete(frontendBackendRouteLinks)
await db.delete(moduleRoutes)

await seedModuleRoutes()

const allRoutes = await db.select({
  id: moduleRoutes.id,
  url: moduleRoutes.url,
  protegida: moduleRoutes.protegida,
  tipoRuta: moduleRoutes.tipoRuta,
  metodo: moduleRoutes.metodo
}).from(moduleRoutes)

const routeByKey = new Map(allRoutes.map(route => [keyForRoute(route), route]))

if (preserveRolePermissions) {
  const restoredPermissions = permissionsSnapshot
    .map(permission => {
      const route = routeByKey.get(keyForRoute(permission))
      if (!route) return null
      return {
        rolId: permission.rolId,
        rutaModuloId: route.id,
        ver: permission.ver,
        agregar: permission.agregar,
        editar: permission.editar,
        eliminar: permission.eliminar
      }
    })
    .filter(Boolean) as Array<{
      rolId: number
      rutaModuloId: number
      ver: boolean
      agregar: boolean
      editar: boolean
      eliminar: boolean
    }>

  if (restoredPermissions.length > 0) {
    await db.insert(roleRoutePermissions).values(restoredPermissions)
  }

  const restoredLinks = linksSnapshot
    .map(link => {
      const frontendRoute = routeByKey.get(`frontend|${link.frontendUrl}|`)
      const backendRoute = routeByKey.get(`backend|${link.backendUrl}|${link.backendMethod ?? ''}`)
      if (!frontendRoute || !backendRoute) return null
      return {
        frontendRouteId: frontendRoute.id,
        backendRouteId: backendRoute.id
      }
    })
    .filter(Boolean) as Array<{ frontendRouteId: number; backendRouteId: number }>

  const existingSeededLinks = await db.select({
    frontendRouteId: frontendBackendRouteLinks.frontendRouteId,
    backendRouteId: frontendBackendRouteLinks.backendRouteId
  }).from(frontendBackendRouteLinks)

  const existingLinkKeys = new Set(
    existingSeededLinks.map(link => `${link.frontendRouteId}|${link.backendRouteId}`)
  )

  const uniqueLinks = new Map<string, { frontendRouteId: number; backendRouteId: number }>()
  for (const link of restoredLinks) {
    const key = `${link.frontendRouteId}|${link.backendRouteId}`
    if (!existingLinkKeys.has(key) && !uniqueLinks.has(key)) {
      uniqueLinks.set(key, link)
    }
  }

  const linksToInsert = Array.from(uniqueLinks.values())
  if (linksToInsert.length > 0) {
    await db.insert(frontendBackendRouteLinks).values(linksToInsert)
  }
}

const protectedRouteIds = allRoutes
  .filter(route => route.protegida)
  .map(route => route.id)

async function getOrCreateRole(nombre: string, descripcion: string) {
  const existing = await db.query.roles.findFirst({ where: eq(roles.nombre, nombre) })
  if (existing) return existing

  const [created] = await db.insert(roles)
    .values({ nombre, descripcion })
    .returning()

  return created!
}

if (!preserveRolePermissions) {
  // Crear/obtener rol admin con todo activado
  const adminRol = await getOrCreateRole('Admin', 'Acceso total')

  await db.delete(roleRoutePermissions)
    .where(eq(roleRoutePermissions.rolId, adminRol.id))

  await db.insert(roleRoutePermissions).values(
    protectedRouteIds.map(routeId => ({
      rolId: adminRol.id,
      rutaModuloId: routeId,
      ver: true, agregar: true, editar: true, eliminar: true
    }))
  )

  // Crear/obtener rol operador
  const operadorRol = await getOrCreateRole('Operador', 'Operaciones basicas')

  await db.delete(roleRoutePermissions)
    .where(eq(roleRoutePermissions.rolId, operadorRol.id))

  const rutasOperador = ['/gps', '/gps/team-fleet', '/gps/area-stays', '/gps/report']
  const operadorRouteIds = allRoutes
    .filter(route => route.protegida && rutasOperador.includes(route.url))
    .map(route => route.id)

  if (operadorRouteIds.length > 0) {
    await db.insert(roleRoutePermissions).values(
      operadorRouteIds.map(routeId => ({
        rolId: operadorRol.id,
        rutaModuloId: routeId,
        ver: true,
        agregar: false,
        editar: true,
        eliminar: false
      }))
    )
  }
}

process.exit(0)
