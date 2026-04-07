// app/utils/navigation-map.ts

export interface FrontPermissionActions {
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}
export type FrontRoutePermissionMap = Record<number, FrontPermissionActions>
export interface FrontPermissionPayload {
  routes: FrontRoutePermissionMap
}
export interface FrontModuleRouteRule {
  id: number
  url: string
  tipoRuta: 'frontend' | 'backend'
  protegida: boolean
}


let navigationMapCache: FrontModuleRouteRule[] | null = null
let navigationMapPromise: Promise<FrontModuleRouteRule[]> | null = null

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

function matchPath(requestPath: string, rulePath: string): boolean {
  const normalizedRequest = normalizePath(requestPath)
  const normalizedRule = normalizePath(rulePath)

  if (normalizedRule.endsWith('/*')) {
    const base = normalizedRule.slice(0, -2)
    return normalizedRequest === base || normalizedRequest.startsWith(`${base}/`)
  }

  if (normalizedRule.includes('/*/')) {
    const ruleParts = normalizedRule.split('/').filter(Boolean)
    const requestParts = normalizedRequest.split('/').filter(Boolean)
    if (ruleParts.length !== requestParts.length) return false
    return ruleParts.every((part, index) => part === '*' || part === requestParts[index])
  }

  return normalizedRequest === normalizedRule
}

/**
 * Carga el mapa de navegación oficial de la aplicación.
 * Consume el endpoint especializado que ya viene filtrado y ordenado por el server.
 */
export async function getNavigationMap(headers?: Record<string, string>): Promise<FrontModuleRouteRule[]> {
  if (navigationMapCache) return navigationMapCache
  if (navigationMapPromise) return await navigationMapPromise

  if (import.meta.client) {
    const stored = localStorage.getItem('app:navigation-map')
    if (stored) {
      navigationMapCache = JSON.parse(stored)
      return navigationMapCache!
    }
  }

  navigationMapPromise = (async () => {
    try {
      // Llamamos al nuevo endpoint semántico
      const rows = await $fetch<FrontModuleRouteRule[]>('/api/module-routes/frontend-map', { headers })
      navigationMapCache = rows 

      if (import.meta.client) {
        localStorage.setItem('app:navigation-map', JSON.stringify(navigationMapCache))
      }
      return navigationMapCache
    } catch {
      navigationMapCache = []
      return []
    } finally {
      navigationMapPromise = null
    }
  })()
  return await navigationMapPromise
}

/**
 * Encuentra qué regla del mapa de navegación coincide con la URL actual del navegador.
 */

export async function matchCurrentView(path: string, headers?: Record<string, string>): Promise<FrontModuleRouteRule | null> {
  const normalizedPath = normalizePath(path)
  const map = await getNavigationMap(headers)

  return map.find((view) => {
    return matchPath(normalizedPath, view.url)
  }) ?? null

}

/**
 * Verifica si el usuario tiene permiso de entrada para una vista específica por su ID.
 */
export function canUserView(
  permissions: FrontPermissionPayload | null,
  viewId: number
): boolean {
  if (!permissions) return false
  const key = String(viewId)
  return permissions.routes?.[key]?.ver === true
}