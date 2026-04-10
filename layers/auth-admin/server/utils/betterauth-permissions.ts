// layers/auth-admin/server/utils/betterauth-permissions.ts
import type { H3Event } from 'h3'
import { db } from '@nuxthub/db'
import { auth } from '~~/layers/auth-admin/server/lib/auth'
import { ModuleRouteService } from '#layers/auth-admin/server/services/ModuleRoute/ModuleRoute.service'
import { RoleService } from '#layers/auth-admin/server/services/Role/Role.service'
import { PermissionPayload,PermissionAction } from '#layers/auth-admin/server/Repository/Interfaces/IRoleRepository'

// Instanciación única con Inyección de Dependencias
const moduleRouteService = new ModuleRouteService(db)
const roleService = new RoleService(db)

export function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  // Limpia slashes dobles y quita el final (ej: /api//user/ -> /api/user)
  return withSlash.length > 1 
    ? withSlash.replace(/\/+$/, '').replace(/\/+/g, '/') 
    : withSlash
}

export function matchPath(requestPath: string, rulePath: string): boolean {
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

/* Obtiene la ID del usuario autenticado */
export async function getAuthenticatedUserId(event: H3Event): Promise<string> {
    const serverSession = await auth.api.getSession({
        headers: getHeaders(event) as HeadersInit
    })
    if (!serverSession?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
    }
    return serverSession.user.id
}

/* Obtiene el mapa de permisos consolidado del usuario */
export async function getMyPermissions(event: H3Event): Promise<PermissionPayload> {
    const userId = await getAuthenticatedUserId(event)
    return await roleService.getUserPermissions(userId)
}
/**
 * Lógica principal de autorización (Búnker Backend)
 */
export async function requireBackendPermission(event: H3Event): Promise<void> {
    const path = event.path.split('?')[0]
    const method = event.method || 'GET'

    const matchedRoute = await moduleRouteService.resolveBackendRule(path, method)

    console.log('[AUTH] Request', { method, path })
    console.log('[AUTH] Matched route', matchedRoute ? {
        id: matchedRoute.id,
        url: matchedRoute.url,
        metodo: matchedRoute.metodo,
        accionRequerida: matchedRoute.accionRequerida
    } : null)

    if (!matchedRoute) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Acceso denegado: Recurso no mapeado.'
        })
    }

    if (!matchedRoute.protegida) return

    const userId = await getAuthenticatedUserId(event)
    const permissions = await roleService.getUserPermissions(userId)
    const action = matchedRoute.accionRequerida ?? methodToAction(method)
    const requiredActions = toAllowedActions(method, action)

    const linkedFrontendIds = await moduleRouteService.getLinkedFrontendIds(matchedRoute.id)
    const hasLinkedFrontend = linkedFrontendIds.length > 0
    const hasLinkedFrontendAccess = linkedFrontendIds.some(id =>
        requiredActions.some(required => permissions.routes?.[id]?.[required] === true)
    )

    console.log('[AUTH] Decision', {
        userId,
        action,
        requiredActions,
        linkedFrontendIds,
        hasLinkedFrontend,
        hasLinkedFrontendAccess
    })

    if (!hasLinkedFrontend) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Acceso denegado: Ruta backend sin interfaz vinculada.'
        })
    }

    if (hasLinkedFrontendAccess) {
        return
    }

    throw createError({
        statusCode: 403,
        statusMessage: `No tienes permiso para ${requiredActions.join(' o ')} en este recurso.`
    })
}

// ESTA FUNCIÓN DEBE IR FUERA
function methodToAction(method: string | undefined): PermissionAction {
    const m = String(method || 'GET').toUpperCase()
    if (m === 'POST') return 'agregar'
    if (m === 'PUT' || m === 'PATCH') return 'editar'
    if (m === 'DELETE') return 'eliminar'
    return 'ver'
}

function toAllowedActions(method: string | undefined, action: PermissionAction): PermissionAction[] {
    const m = String(method || 'GET').toUpperCase()
    if (m === 'POST') return ['agregar', 'ver']
    if (m === 'PUT' || m === 'PATCH') return ['editar']
    if (m === 'DELETE') return ['eliminar']
    if (m === 'GET') return ['ver']
    return [action]
}