import type { FrontPermissionPayload } from '~/lib/route-permissions'

type FrontModuleRouteRow = {
  id: number
  url: string
  tipoRuta: 'frontend' | 'backend'
  protegida: boolean
}

const PRIORITY_FRONTEND_ROUTES = [
  '/gps',
  '/gps/report',
  '/gps/report/analisis-trayectos',
  '/gps/area-stays',
  '/gps/team-fleet',
  '/gps/alert/config-alert',
  '/gps/alert/historial-alertas',
  '/configuracion/roles'
]

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

export async function resolveBestAuthorizedFrontendRoute(): Promise<string | null> {
  const [permissions, moduleRoutes] = await Promise.all([
    $fetch<FrontPermissionPayload>('/api/auth/mis-permisos'),
    $fetch<FrontModuleRouteRow[]>('/api/module-routes')
  ])

  const allowedFrontendPaths = moduleRoutes
    .filter(route => route.tipoRuta === 'frontend' && route.protegida)
    .filter(route => permissions.routes?.[route.id]?.ver === true)
    .map(route => normalizePath(route.url))

  if (allowedFrontendPaths.length === 0) return null

  for (const preferredPath of PRIORITY_FRONTEND_ROUTES) {
    const normalizedPreferred = normalizePath(preferredPath)
    if (allowedFrontendPaths.includes(normalizedPreferred)) return normalizedPreferred
  }

  return [...allowedFrontendPaths].sort((a, b) => a.localeCompare(b))[0] ?? null
}
