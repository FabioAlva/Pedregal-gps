import { db } from '@nuxthub/db'
import { and, eq, isNull } from 'drizzle-orm'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { frontendBackendRouteLinks, moduleRoutes } from '../schema'

type SeedRule = {
  nombre: string
  url: string
  tipoRuta: 'frontend' | 'backend'
  metodo: string | null
  accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida: boolean
}

function toInternalRouteKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'route.general'
}

function toPosixPath(input: string): string {
  return input.split(sep).join('/')
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']')
}

function normalizeSegment(segment: string): string {
  return isDynamicSegment(segment) ? '*' : segment
}

function buildFrontendUrl(relativePath: string): string | null {
  const clean = relativePath.replace(/\.vue$/, '')
  const rawSegments = clean.split('/').filter(Boolean)
  const segments = rawSegments
    .filter(segment => segment !== 'index')
    .map(normalizeSegment)

  if (segments.length === 0) return '/'
  return `/${segments.join('/')}`
}

function buildBackendUrl(relativePath: string): string {
  const rawSegments = relativePath.split('/').filter(Boolean)
  const segments = rawSegments
    .filter(segment => segment !== 'index')
    .map(normalizeSegment)

  return segments.length === 0 ? '/api' : `/api/${segments.join('/')}`
}

function actionFromMethod(method?: string | null) {
  const value = (method ?? '').toUpperCase()
  if (value === 'POST') return 'agregar' as const
  if (value === 'PUT' || value === 'PATCH') return 'editar' as const
  if (value === 'DELETE') return 'eliminar' as const
  if (value === 'GET') return 'ver' as const
  return null
}

function collectFiles(root: string, subPath: string, ext: string): string[] {
  const base = join(root, subPath)
  try {
    if (!statSync(base).isDirectory()) return []
  } catch {
    return []
  }

  const results: string[] = []

  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath)
      }
    }
  }

  walk(base)
  return results
}

function listLayerNames(root: string): string[] {
  const layersDir = join(root, 'layers')
  try {
    return readdirSync(layersDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch {
    return []
  }
}

function buildAutoFrontendRules(): SeedRule[] {
  const root = process.cwd()
  const rules: SeedRule[] = []
  const pageRoots = ['app/pages', ...listLayerNames(root).map(layer => `layers/${layer}/app/pages`)]

  for (const pageRoot of pageRoots) {
    const files = collectFiles(root, pageRoot, '.vue')
    for (const file of files) {
      const posix = toPosixPath(relative(root, file))
      const match = posix.match(/\/app\/pages\/(.+)\.vue$/)
      if (!match) continue
      const url = buildFrontendUrl(match[1])
      if (!url) continue
      rules.push({
        nombre: `Ruta ${url}`,
        url,
        tipoRuta: 'frontend' as const,
        metodo: null,
        accionRequerida: null,
        protegida: true
      })
    }
  }

  return rules
}

function buildAutoBackendRules(): SeedRule[] {
  const root = process.cwd()
  const rules: SeedRule[] = []
  const apiRoots = ['server/api', ...listLayerNames(root).map(layer => `layers/${layer}/server/api`)]
  const methodPattern = /\/server\/api\/(.+)\.(get|post|patch|put|delete|options|head)\.ts$/i

  for (const apiRoot of apiRoots) {
    const files = collectFiles(root, apiRoot, '.ts')
    for (const file of files) {
      const posix = toPosixPath(relative(root, file))
      let relativePath: string | null = null
      let method: string | null = null

      const methodMatch = posix.match(methodPattern)
      if (methodMatch) {
        relativePath = methodMatch[1]
        method = methodMatch[2].toUpperCase()
      } else {
        const anyMatch = posix.match(/\/server\/api\/(.+)\.ts$/)
        if (!anyMatch) continue
        relativePath = anyMatch[1]
      }

      const url = buildBackendUrl(relativePath)
      rules.push({
        nombre: method ? `API ${method} ${url}` : `API ${url}`,
        url,
        tipoRuta: 'backend' as const,
        metodo: method,
        accionRequerida: actionFromMethod(method),
        protegida: true
      })
    }
  }

  return rules
}

function mergeRules(rules: SeedRule[]) {
  const map = new Map<string, SeedRule>()
  for (const rule of rules) {
    const key = `${rule.tipoRuta}|${rule.url}|${rule.metodo ?? ''}`
    if (!map.has(key)) map.set(key, rule)
  }
  return Array.from(map.values())
}

const DEFAULT_RULES: SeedRule[] = [
  { nombre: 'Inicio', url: '/', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: false },
  { nombre: 'Login', url: '/login', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: false },
  { nombre: 'Mapa en vivo', url: '/gps', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Campos (lista)', url: '/gps/geo/fields-list', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Reporte GPS', url: '/gps/report', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Analisis de trayectos', url: '/gps/report/analisis-trayectos', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Ingresos por area', url: '/gps/area-stays', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Asignacion GPS', url: '/gps/team-fleet', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Historial alertas', url: '/gps/alert/historial-alertas', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Configurar alertas', url: '/gps/alert/config-alert', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Roles y permisos', url: '/configuracion/roles', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Taller y reparaciones', url: '/work-orders/open', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Mantenimientos programados', url: '/pm/schedules', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Almacen de repuestos', url: '/inventory/parts', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },
  { nombre: 'Ajustes del sistema', url: '/settings/company', tipoRuta: 'frontend' as const, metodo: null, accionRequerida: null, protegida: true },

  // Mapa y geocercas
  { nombre: 'API mapa ruta', url: '/api/map/route', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas listar', url: '/api/geofence', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas crear', url: '/api/geofence', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API geocercas obtener', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API geocercas actualizar', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API geocercas eliminar', url: '/api/geofence/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },
  { nombre: 'API campos listar', url: '/api/fields', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API campos crear', url: '/api/fields', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API campos importar', url: '/api/fields/import', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API campos obtener', url: '/api/fields/*', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API campos actualizar', url: '/api/fields/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API campos eliminar', url: '/api/fields/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },

  // Reportes
  { nombre: 'API reporte distancia', url: '/api/map/distance', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API reporte velocidad', url: '/api/map/speed', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API reporte inactividad', url: '/api/map/stops', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API analisis trayectos', url: '/api/map/route-analysis', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API estadias por area', url: '/api/geofence-stays/report', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API estadias por campo', url: '/api/field-stays/report', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'ver' as const, protegida: true },

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
,
  // Taller y papeles
  { nombre: 'API mantenimientos programados listar', url: '/api/pm/schedules', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API mantenimientos programados crear', url: '/api/pm/schedules', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API mantenimientos programados editar', url: '/api/pm/schedules/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API mantenimientos programados eliminar', url: '/api/pm/schedules/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },
  { nombre: 'API ordenes taller listar', url: '/api/work-orders', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API ordenes taller crear', url: '/api/work-orders', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API ordenes taller editar', url: '/api/work-orders/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API ordenes taller eliminar', url: '/api/work-orders/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true },
  { nombre: 'API repuestos listar', url: '/api/inventory/parts', tipoRuta: 'backend' as const, metodo: 'GET', accionRequerida: 'ver' as const, protegida: true },
  { nombre: 'API repuestos crear', url: '/api/inventory/parts', tipoRuta: 'backend' as const, metodo: 'POST', accionRequerida: 'agregar' as const, protegida: true },
  { nombre: 'API repuestos editar', url: '/api/inventory/parts/*', tipoRuta: 'backend' as const, metodo: 'PATCH', accionRequerida: 'editar' as const, protegida: true },
  { nombre: 'API repuestos eliminar', url: '/api/inventory/parts/*', tipoRuta: 'backend' as const, metodo: 'DELETE', accionRequerida: 'eliminar' as const, protegida: true }
]

const DEFAULT_FRONTEND_BACKEND_LINKS = [
  // /gps (mapa + geocercas)
  { frontendUrl: '/gps', backendUrl: '/api/map/route', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'PATCH' },
  { frontendUrl: '/gps', backendUrl: '/api/geofence/*', backendMethod: 'DELETE' },
  { frontendUrl: '/gps', backendUrl: '/api/fields', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/fields', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/fields/import', backendMethod: 'POST' },
  { frontendUrl: '/gps', backendUrl: '/api/fields/*', backendMethod: 'GET' },
  { frontendUrl: '/gps', backendUrl: '/api/fields/*', backendMethod: 'PATCH' },
  { frontendUrl: '/gps', backendUrl: '/api/fields/*', backendMethod: 'DELETE' },

  // /gps/geo/fields-list
  { frontendUrl: '/gps/geo/fields-list', backendUrl: '/api/fields', backendMethod: 'GET' },

  // /gps/report
  { frontendUrl: '/gps/report', backendUrl: '/api/map/distance', backendMethod: 'POST' },
  { frontendUrl: '/gps/report', backendUrl: '/api/map/speed', backendMethod: 'POST' },
  { frontendUrl: '/gps/report', backendUrl: '/api/map/stops', backendMethod: 'POST' },

  // /gps/report/analisis-trayectos
  { frontendUrl: '/gps/report/analisis-trayectos', backendUrl: '/api/map/route-analysis', backendMethod: 'POST' },

  // /gps/area-stays
  { frontendUrl: '/gps/area-stays', backendUrl: '/api/geofence-stays/report', backendMethod: 'POST' },
  { frontendUrl: '/gps/area-stays', backendUrl: '/api/field-stays/report', backendMethod: 'POST' },

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
,
  // Taller y papeles
  { frontendUrl: '/work-orders/open', backendUrl: '/api/work-orders', backendMethod: 'GET' },
  { frontendUrl: '/work-orders/open', backendUrl: '/api/work-orders', backendMethod: 'POST' },
  { frontendUrl: '/work-orders/open', backendUrl: '/api/work-orders/*', backendMethod: 'PATCH' },
  { frontendUrl: '/work-orders/open', backendUrl: '/api/work-orders/*', backendMethod: 'DELETE' },
  { frontendUrl: '/pm/schedules', backendUrl: '/api/pm/schedules', backendMethod: 'GET' },
  { frontendUrl: '/pm/schedules', backendUrl: '/api/pm/schedules', backendMethod: 'POST' },
  { frontendUrl: '/pm/schedules', backendUrl: '/api/pm/schedules/*', backendMethod: 'PATCH' },
  { frontendUrl: '/pm/schedules', backendUrl: '/api/pm/schedules/*', backendMethod: 'DELETE' },
  { frontendUrl: '/inventory/parts', backendUrl: '/api/inventory/parts', backendMethod: 'GET' },
  { frontendUrl: '/inventory/parts', backendUrl: '/api/inventory/parts', backendMethod: 'POST' },
  { frontendUrl: '/inventory/parts', backendUrl: '/api/inventory/parts/*', backendMethod: 'PATCH' },
  { frontendUrl: '/inventory/parts', backendUrl: '/api/inventory/parts/*', backendMethod: 'DELETE' }
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
  const autoRules = mergeRules([
    ...buildAutoFrontendRules(),
    ...buildAutoBackendRules(),
  ])
  const rules = mergeRules([...DEFAULT_RULES, ...autoRules])

  for (const rule of rules) {
    const existing = await db.query.moduleRoutes.findFirst({
      where: and(
        eq(moduleRoutes.url, rule.url),
        eq(moduleRoutes.tipoRuta, rule.tipoRuta),
        rule.metodo ? eq(moduleRoutes.metodo, rule.metodo) : isNull(moduleRoutes.metodo)
      )
    })

    if (existing) {
      const shouldUpdate =
        existing.nombre !== rule.nombre ||
        existing.protegida !== rule.protegida ||
        existing.accionRequerida !== rule.accionRequerida

      if (shouldUpdate) {
        await db.update(moduleRoutes)
          .set({
            nombre: rule.nombre,
            accionRequerida: rule.accionRequerida,
            protegida: rule.protegida,
            capacidadClave: toInternalRouteKey(rule.url)
          })
          .where(eq(moduleRoutes.id, existing.id))
      }

      continue
    }

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
