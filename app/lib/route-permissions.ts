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

const EMPTY_ROUTE_RULES: FrontModuleRouteRule[] = []

let cachedModuleRouteRules: FrontModuleRouteRule[] | null = null
let isLoadingModuleRouteRules = false
let moduleRouteRulesPromise: Promise<FrontModuleRouteRule[]> | null = null

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

function normalizeRules(rules: FrontModuleRouteRule[] | null | undefined): FrontModuleRouteRule[] {
  return (rules ?? [])
    .filter(rule => Boolean(rule.id && rule.url) && rule.protegida === true && rule.tipoRuta === 'frontend')
    .map(rule => ({
      ...rule,
      url: normalizePath(rule.url)
    }))
    .sort((a, b) => b.url.length - a.url.length)
}

export async function loadModuleRouteRules(): Promise<FrontModuleRouteRule[]> {
  if (cachedModuleRouteRules) return cachedModuleRouteRules
  if (moduleRouteRulesPromise) return await moduleRouteRulesPromise

  isLoadingModuleRouteRules = true
  moduleRouteRulesPromise = (async () => {
    try {
      const rows = await $fetch<FrontModuleRouteRule[]>('/api/module-routes')
      cachedModuleRouteRules = normalizeRules(rows)

      if (cachedModuleRouteRules.length === 0) cachedModuleRouteRules = EMPTY_ROUTE_RULES
      return cachedModuleRouteRules
    } catch {
      cachedModuleRouteRules = EMPTY_ROUTE_RULES
      return cachedModuleRouteRules
    } finally {
      isLoadingModuleRouteRules = false
      moduleRouteRulesPromise = null
    }
  })()

  return await moduleRouteRulesPromise
}

export async function resolveRouteByPath(path: string): Promise<FrontModuleRouteRule | null> {
  const normalizedPath = normalizePath(path)
  const rules = await loadModuleRouteRules()

  const rule = rules.find((candidate) => {
    if (candidate.url === '/') return normalizedPath === '/'
    return normalizedPath === candidate.url || normalizedPath.startsWith(`${candidate.url}/`)
  })

  return rule ?? null
}

export function hasViewPermission(
  permissionPayload: FrontPermissionPayload | null,
  routeId: number
): boolean {
  if (!permissionPayload) return false
  const routePermissions = permissionPayload.routes?.[routeId]
  return routePermissions?.ver === true
}
