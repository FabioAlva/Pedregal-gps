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
 * Lógica principal de middleware
 */
// export async function requireBackendPermission(event: H3Event): Promise<void> {
//     // 1. Identificar si la ruta de backend está registrada y protegida
//     const matchedRoute = await moduleRouteService.resolveRule(event.path, event.method || 'GET')
//     if (!matchedRoute) return // Ruta no registrada en DB o no protegida: libre paso

//     // 2. Obtener identidad y permisos consolidados
//     const userId = await getAuthenticatedUserId(event)
//     const permissions = await roleService.getUserPermissions(userId)

//     // 3. Determinar acción requerida (basado en DB o verbo HTTP)
//     const action: PermissionAction = matchedRoute.accionRequerida ?? methodToAction(event.method)
    
//     // 4. Verificar permisos directos y rutas frontend vinculadas
//     const routePermissions = permissions.routes?.[matchedRoute.id]
//     const linkedFrontendIds = await moduleRouteService.getLinkedFrontendIds(matchedRoute.id)

//     const hasLinkedFrontendAccess = linkedFrontendIds.length === 0
//         ? true
//         : linkedFrontendIds.some(id => permissions.routes?.[id]?.ver === true)

//     const allowed = routePermissions?.[action] === true && hasLinkedFrontendAccess

//     if (allowed) return

//     // 5. Manejo de errores detallado
//     const message = !hasLinkedFrontendAccess 
//         ? 'No autorizado: requiere acceso a una vista frontend relacionada'
//         : `No autorizado para ${action} en ${matchedRoute.url}`

//     throw createError({ statusCode: 403, statusMessage: message })
// }

/**
 * Lógica principal de middleware con DEBUG LOGS
 */
export async function requireBackendPermission(event: H3Event): Promise<void> {
    const path = event.path;
    const method = event.method || 'GET';

    console.log(`\n--- [DEBUG AUTH] Iniciando verificación para: ${method} ${path} ---`);

    // 1. Identificar si la ruta de backend está registrada y protegida
    const matchedRoute = await moduleRouteService.resolveRule(path, method);
    
    if (!matchedRoute) {
        console.log(`⚠️  Ruta [${path}] no registrada en DB o no marcada como protegida. Acceso LIBRE.`);
        return;
    }

    console.log(`✅ Ruta identificada en DB: ID ${matchedRoute.id} | URL: ${matchedRoute.url} | Protegida: ${matchedRoute.protegida}`);

 // 2. Obtener identidad y permisos consolidados
const userId = await getAuthenticatedUserId(event);
const permissions = await roleService.getUserPermissions(userId);

// --- LOG DE EMERGENCIA 1: Ver qué llega exactamente de la DB ---
console.log(`🚨 [DATA DUMP] Permisos para la ruta ${matchedRoute.id}:`, 
    JSON.stringify(permissions.routes?.[matchedRoute.id] || 'SIN PERMISOS')
);

// 3. Determinar acción requerida
const action: PermissionAction = matchedRoute.accionRequerida ?? methodToAction(method);

// 4. Verificar permisos directos
const routePermissions = permissions.routes?.[matchedRoute.id];
const hasDirectPermission = routePermissions?.[action] === true;

// --- LOG DE EMERGENCIA 2: ¿Por qué dio true? ---
if (hasDirectPermission) {
    console.log(`🔎 [REVISIÓN] El sistema dice SÍ porque "${action}" es true en el objeto de arriba.`);
}
    console.log(`🔑 Permiso directo [${action}] en esta ruta: ${hasDirectPermission ? 'SÍ' : 'NO'}`);

    // 5. Verificar rutas frontend vinculadas
    const linkedFrontendIds = await moduleRouteService.getLinkedFrontendIds(matchedRoute.id);
    console.log(`🔗 Rutas Frontend vinculadas: [${linkedFrontendIds.join(', ')}]`);

    const hasLinkedFrontendAccess = linkedFrontendIds.length === 0
        ? true
        : linkedFrontendIds.some(id => {
            const canSee = permissions.routes?.[id]?.ver === true;
            console.log(`   - Validando acceso a Frontend ID ${id}: ${canSee ? 'OK' : 'DENY'}`);
            return canSee;
        });

    console.log(`🌐 Acceso por vínculos frontend: ${hasLinkedFrontendAccess ? 'SÍ' : 'NO'}`);

    // 6. Decisión Final
    const allowed = hasDirectPermission && hasLinkedFrontendAccess;
    console.log(`🏁 RESULTADO FINAL: ${allowed ? '✅ PERMITIDO' : '❌ BLOQUEADO'}`);
    console.log(`-----------------------------------------------------------\n`);

    if (allowed) return;

    // 7. Manejo de errores
    const message = !hasLinkedFrontendAccess 
        ? 'No autorizado: requiere acceso a una vista frontend relacionada'
        : `No autorizado para ${action} en ${matchedRoute.url}`;

    throw createError({ statusCode: 403, statusMessage: message });
}

/**
 * Helpers privados (Se mantienen igual)
 */
function methodToAction(method: string | undefined): PermissionAction {
    const m = String(method || 'GET').toUpperCase()
    if (['POST'].includes(m)) return 'agregar'
    if (['PUT', 'PATCH'].includes(m)) return 'editar'
    if (['DELETE'].includes(m)) return 'eliminar'
    return 'ver'
}