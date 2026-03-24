import { db } from "@nuxthub/db";
import { moduleRoutes, roles, roleRoutePermissions } from '../schema'
import { eq } from 'drizzle-orm'
import { seedModuleRoutes } from './section-routes.seed'

await seedModuleRoutes()

const allRoutes = await db.select({
  id: moduleRoutes.id,
  url: moduleRoutes.url,
  protegida: moduleRoutes.protegida
}).from(moduleRoutes)

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

console.log('✅ Seed completado')
process.exit(0)
