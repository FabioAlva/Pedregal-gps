import type { H3Event } from 'h3'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { auth } from '~~/server/lib/auth'
import { PermissionService } from '~~/server/services/Permission/Permission.service'
import type { PermissionPayload } from '~~/server/Repository/Interfaces/IPermissionRepository'
import { frontendBackendRouteLinks, moduleRoutes } from '~~/server/db/schema'
import type { PermissionAction } from '~~/server/Repository/Interfaces/IPermissionRepository'

const permissionService = new PermissionService()

type BackendRouteRule = {
	id: number
	url: string
	metodo: string | null
	accionRequerida: PermissionAction | null
	protegida: boolean
}

const SESSION_COOKIE_CANDIDATES = [
	'better-auth.session_token',
	'__Secure-better-auth.session_token'
]

function getSessionToken(event: H3Event): string | null {
	console.info('[permissions] buscando session token', {
		path: event.path,
		cookieCandidates: SESSION_COOKIE_CANDIDATES
	})

	for (const cookieName of SESSION_COOKIE_CANDIDATES) {
		const value = getCookie(event, cookieName)
		if (value) {
			console.info('[permissions] session token encontrado', {
				cookieName,
				tokenPreview: `${value.slice(0, 8)}...`
			})
			return value
		}
	}

	console.warn('[permissions] no se encontro session token')
	return null
}

export async function getAuthenticatedUserId(event: H3Event): Promise<string> {
	// TODO(auth): Fuente de verdad de sesion en server. Evita divergencias con validacion manual de token.
	const serverSession = await auth.api.getSession({
		headers: getHeaders(event) as HeadersInit
	})

	const betterAuthUserId = serverSession?.user?.id
	console.info('[permissions] auth.api.getSession result', {
		hasSession: Boolean(serverSession),
		userId: betterAuthUserId ?? null
	})

	if (betterAuthUserId) {
		return betterAuthUserId
	}

	// FIXME(auth): Este fallback queda temporal para diagnostico; remover cuando se confirme estabilidad.
	const token = getSessionToken(event)

	if (!token) {
		console.warn('[permissions] usuario no autenticado: token ausente')
		throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
	}

	const userId = await permissionService.getAuthenticatedUserIdBySessionToken(token)
	console.info('[permissions] resultado de token -> userId', {
		hasUserId: Boolean(userId),
		userId: userId ?? null
	})

	if (!userId) {
		console.warn('[permissions] sesion invalida o expirada para token actual')
		throw createError({ statusCode: 401, statusMessage: 'Sesion invalida o expirada' })
	}

	return userId
}

export async function getMyPermissions(event: H3Event): Promise<PermissionPayload> {
	const userId = await getAuthenticatedUserId(event)
	console.info('[permissions] obteniendo mapa de permisos', { userId })
	const permissionMap = await permissionService.getUserPermissions(userId)
	console.info('[permissions] mapa de permisos obtenido', {
		userId,
		routes: Object.keys(permissionMap?.routes ?? {})
	})
	return permissionMap
}

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

	return normalizedRequest === normalizedRule
}

function methodToAction(method: string): PermissionAction {
	switch (method.toUpperCase()) {
		case 'GET':
		case 'HEAD':
		case 'OPTIONS':
			return 'ver'
		case 'POST':
			return 'agregar'
		case 'PUT':
		case 'PATCH':
			return 'editar'
		case 'DELETE':
			return 'eliminar'
		default:
			return 'ver'
	}
}

async function resolveBackendRule(event: H3Event): Promise<BackendRouteRule | null> {
	const requestPath = normalizePath(event.path)
	const requestMethod = String(event.method || 'GET').toUpperCase()

	const rules = await db
		.select({
			id: moduleRoutes.id,
			url: moduleRoutes.url,
			metodo: moduleRoutes.metodo,
			accionRequerida: moduleRoutes.accionRequerida,
			protegida: moduleRoutes.protegida
		})
		.from(moduleRoutes)
		.where(and(eq(moduleRoutes.tipoRuta, 'backend'), eq(moduleRoutes.protegida, true)))
		.orderBy(asc(moduleRoutes.id))

	const matched = rules.find((rule) => {
		const methodMatches = !rule.metodo || String(rule.metodo).toUpperCase() === requestMethod
		return methodMatches && matchPath(requestPath, rule.url)
	})

	return matched ?? null
}

async function getLinkedFrontendRouteIds(backendRouteId: number): Promise<number[]> {
	const rows = await db
		.select({ frontendRouteId: frontendBackendRouteLinks.frontendRouteId })
		.from(frontendBackendRouteLinks)
		.where(eq(frontendBackendRouteLinks.backendRouteId, backendRouteId))

	return Array.from(new Set(rows.map(row => row.frontendRouteId)))
}

export async function requireBackendPermission(event: H3Event): Promise<void> {
	const matchedRoute = await resolveBackendRule(event)
	if (!matchedRoute) return

	const userId = await getAuthenticatedUserId(event)
	const permissions = await permissionService.getUserPermissions(userId)

	const action: PermissionAction = matchedRoute.accionRequerida ?? methodToAction(String(event.method || 'GET'))
	const routePermissions = permissions.routes?.[matchedRoute.id]
	const linkedFrontendRouteIds = await getLinkedFrontendRouteIds(matchedRoute.id)

	const hasLinkedFrontendAccess = linkedFrontendRouteIds.length === 0
		? true
		: linkedFrontendRouteIds.some((frontendRouteId) => permissions.routes?.[frontendRouteId]?.ver === true)

	const allowed = routePermissions?.[action] === true && hasLinkedFrontendAccess

	if (allowed) return

	if (routePermissions?.[action] !== true) {
		throw createError({
			statusCode: 403,
			statusMessage: `No autorizado para ${action} en ${matchedRoute.url}`
		})
	}

	if (!hasLinkedFrontendAccess) {
		throw createError({
			statusCode: 403,
			statusMessage: 'No autorizado: el endpoint requiere acceso a una ruta frontend relacionada'
		})
	}

	throw createError({
		statusCode: 403,
		statusMessage: `No autorizado para ${action} en ${matchedRoute.url}`
	})
}
