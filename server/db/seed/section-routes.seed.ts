import { db } from '@nuxthub/db'
import { and, eq, isNull } from 'drizzle-orm'
import { frontendBackendRouteLinks, moduleRoutes } from '../schema'

function toInternalRouteKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'route.general'
}

const DEFAULT_RULES = [
  { nombre: 'Mapa en vivo', url: '/gps', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Reporte GPS', url: '/gps/report', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Analisis de trayectos', url: '/gps/report/analisis-trayectos', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Ingresos por area', url: '/gps/area-stays', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Asignacion GPS', url: '/gps/team-fleet', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Historial alertas', url: '/gps/alert/historial-alertas', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Configurar alertas', url: '/gps/alert/config-alert', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Roles y permisos', url: '/configuracion/roles', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },

  // Mapa y geocercas
  { nombre: 'API mapa ruta', url: '/api/map/route', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas listar', url: '/api/geofence', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas crear', url: '/api/geofence', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API geocercas obtener', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas actualizar', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API geocercas eliminar', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },

  // Reportes
  { nombre: 'API reporte distancia', url: '/api/map/distance', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API reporte velocidad', url: '/api/map/speed', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API reporte inactividad', url: '/api/map/stops', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API analisis trayectos', url: '/api/map/route-analysis', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API estadias por area', url: '/api/geofence-stays/report', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },

  // Team fleet
  { nombre: 'API GPS listar', url: '/api/equipment', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API GPS crear', url: '/api/equipment', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API GPS actualizar estado', url: '/api/equipment/*', tipoRuta: 'backend' as const, metodo: 'PUT', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API flotas disponibles', url: '/api/fleets/available', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API flotas listar', url: '/api/fleets', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API asignaciones listar', url: '/api/equipmentFeet', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API asignaciones crear', url: '/api/equipmentFeet', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API asignaciones activas', url: '/api/equipmentFeet/active', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API asignaciones editar', url: '/api/equipmentFeet/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },

  // Alertas
  { nombre: 'API alertas listar', url: '/api/gps-alert', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API alertas crear', url: '/api/gps-alert', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API alertas obtener', url: '/api/gps-alert/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API alertas actualizar', url: '/api/gps-alert/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API alertas eliminar', url: '/api/gps-alert/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },
  { nombre: 'API logs alerta listar', url: '/api/gps-alert-logs', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API logs por alerta', url: '/api/gps-alert-logs/by-alert/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API logs por equipo', url: '/api/gps-alert-logs/by-equipment/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },

  // Configuracion de usuarios y roles
  { nombre: 'API roles listar', url: '/api/roles', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API roles crear', url: '/api/roles', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API roles obtener', url: '/api/roles/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API roles editar', url: '/api/roles/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API roles eliminar', url: '/api/roles/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },
  { nombre: 'API permisos por rol consultar', url: '/api/roles/*/route-permissions', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API permisos por rol guardar', url: '/api/roles/*/route-permissions', tipoRuta: 'backend' as const, metodo: 'PUT', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API usuarios listar', url: '/api/users', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API usuarios crear', url: '/api/users', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API usuarios editar', url: '/api/users/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API usuarios roles consultar', url: '/api/users/*/roles', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API usuarios roles guardar', url: '/api/users/*/roles', tipoRuta: 'backend' as const, metodo: 'PUT', accionRequerida: 'editar' as const, protegida: true }
]

const DEFAULT_FRONTEND_BACKEND_LINKS = [
  // /gps (mapa + geocercas)
  { frontendUrl: '/gps', backendUrl: '/api/map/route', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'PATCH' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'DELETE' },

  // /gps/report
  { frontendUrl: '/gps/report', backendUrl: '/api/map/distance', backendMethod: 'POST' },
  { frontendUrl: '/gps/report', backendUrl: '/api/map/speed', backendMethod: 'POST' },
  { frontendUrl: '/gps/report', backendUrl: '/api/map/stops', backendMethod: 'POST' },

  // /gps/report/analisis-trayectos
  { frontendUrl: '/gps/report/analisis-trayectos', backendUrl: '/api/map/route-analysis', backendMethod: 'POST' },

  // /gps/area-stays
  { frontendUrl: '/gps/area-stays', backendUrl: '/api/geofence-stays/report', backendMethod: 'POST' },

  // /gps/team-fleet
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipment', backendMethod: 'GET' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipment/*', backendMethod: 'PUT' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/fleets', backendMethod: 'GET' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/fleets/available', backendMethod: 'GET' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipmentFeet', backendMethod: 'GET' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipmentFeet', backendMethod: 'POST' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipmentFeet/active', backendMethod: 'GET' },
  { frontendUrl: '/gps/team-fleet', backendUrl: '/api/equipmentFeet/*', backendMethod: 'PATCH' },

  // /gps/alert/config-alert
  { frontendUrl: '/gps/alert/config-alert', backendUrl: '/api/gps-alert', backendMethod: 'GET' },
  { frontendUrl: '/gps/alert/config-alert', backendUrl: '/api/gps-alert', backendMethod: 'POST' },
  { frontendUrl: '/gps/alert/config-alert', backendUrl: '/api/gps-alert/*', backendMethod: 'GET' },
  { frontendUrl: '/gps/alert/config-alert', backendUrl: '/api/gps-alert/*', backendMethod: 'PATCH' },
  { frontendUrl: '/gps/alert/config-alert', backendUrl: '/api/gps-alert/*', backendMethod: 'DELETE' },

  // /gps/alert/historial-alertas
  { frontendUrl: '/gps/alert/historial-alertas', backendUrl: '/api/gps-alert-logs', backendMethod: 'GET' },
  { frontendUrl: '/gps/alert/historial-alertas', backendUrl: '/api/gps-alert-logs/by-alert/*', backendMethod: 'GET' },
  { frontendUrl: '/gps/alert/historial-alertas', backendUrl: '/api/gps-alert-logs/by-equipment/*', backendMethod: 'GET' },

  // /configuracion/roles
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles', backendMethod: 'GET' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles', backendMethod: 'POST' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles/*', backendMethod: 'GET' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles/*', backendMethod: 'PATCH' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles/*', backendMethod: 'DELETE' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles/*/route-permissions', backendMethod: 'GET' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/roles/*/route-permissions', backendMethod: 'PUT' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/users', backendMethod: 'GET' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/users', backendMethod: 'POST' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/users/*', backendMethod: 'PATCH' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/users/*/roles', backendMethod: 'GET' },
  { frontendUrl: '/configuracion/roles', backendUrl: '/api/users/*/roles', backendMethod: 'PUT' }
]

async function seedFrontendBackendRouteLinks() {
  for (const link of DEFAULT_FRONTEND_BACKEND_LINKS) {
    const frontendRoute = await db.query.moduleRoutes.findFirst({
      where: and(
        eq(moduleRoutes.url, link.frontendUrl),
        eq(moduleRoutes.tipoRuta, 'frontend')
      )
    })

    const backendRoute = await db.query.moduleRoutes.findFirst({
      where: and(
        eq(moduleRoutes.url, link.backendUrl),
        eq(moduleRoutes.tipoRuta, 'backend'),
        eq(moduleRoutes.metodo, link.backendMethod)
      )
    })

    if (!frontendRoute || !backendRoute) continue

    const exists = await db.query.frontendBackendRouteLinks.findFirst({
      where: and(
        eq(frontendBackendRouteLinks.frontendRouteId, frontendRoute.id),
        eq(frontendBackendRouteLinks.backendRouteId, backendRoute.id)
      )
    })

    if (exists) continue

    await db.insert(frontendBackendRouteLinks).values({
      frontendRouteId: frontendRoute.id,
      backendRouteId: backendRoute.id
    })
  }
}

export async function seedModuleRoutes() {
  for (const rule of DEFAULT_RULES) {
    const existing = await db.query.moduleRoutes.findFirst({
      where: and(
        eq(moduleRoutes.url, rule.url),
        eq(moduleRoutes.tipoRuta, rule.tipoRuta),
        rule.metodo ? eq(moduleRoutes.metodo, rule.metodo) : isNull(moduleRoutes.metodo)
      )
    })

    if (existing) continue

    await db.insert(moduleRoutes).values({
      nombre: rule.nombre,
      url: rule.url,
      tipoRuta: rule.tipoRuta,
      metodo: rule.metodo,
      capacidadClave: toInternalRouteKey(rule.url),
      accionRequerida: rule.accionRequerida,
      protegida: rule.protegida
    })
  }

  await seedFrontendBackendRouteLinks()
}

// Legacy alias kept to avoid breaking old imports.
export const seedSectionRoutes = seedModuleRoutes
