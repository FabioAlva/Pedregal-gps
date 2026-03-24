import type { FrontPermissionPayload } from '~/lib/route-permissions'
import { hasViewPermission, resolveRouteByPath } from '~/lib/route-permissions'

export default defineNuxtRouteMiddleware(async (to) => {
  console.info('[auth.middleware] start', { to: to.path })

  const matchedRoute = await resolveRouteByPath(to.path)
  console.info('[auth.middleware] module resolution', {
    to: to.path,
    routeId: matchedRoute?.id ?? null,
    routeUrl: matchedRoute?.url ?? null
  })

  if (!matchedRoute?.id) {
    console.info('[auth.middleware] skip (ruta no protegida)', { to: to.path })
    return
  }

  const permissionsState = useState<FrontPermissionPayload | null>('auth:my-permissions', () => null)

  const hasUsableCachedPermissions = Boolean(
    permissionsState.value
      && Object.keys(permissionsState.value.routes ?? {}).length > 0
  )

  if (!hasUsableCachedPermissions) {
    try {
      console.info('[auth.middleware] cargando permisos desde /api/auth/mis-permisos')
      permissionsState.value = await $fetch<FrontPermissionPayload>('/api/auth/mis-permisos')

      if (!permissionsState.value) {
        console.warn('[auth.middleware] permisos vacios para usuario actual')
      }

      console.info('[auth.middleware] permisos cargados', {
        routes: Object.keys(permissionsState.value?.routes ?? {})
      })
    } catch (error: any) {
      if (error?.statusCode === 401) {
        permissionsState.value = null
        console.warn('[auth.middleware] sin sesion valida, redirigiendo a /login', { to: to.path })
        return navigateTo('/login')
      }

      console.error('[auth.middleware] fallo cargando permisos', {
        statusCode: error?.statusCode,
        statusMessage: error?.statusMessage,
        data: error?.data,
        message: error?.message
      })
      return abortNavigation(createError({ statusCode: 403, statusMessage: 'No se pudieron validar permisos' }))
    }
  } else {
    console.info('[auth.middleware] usando permisos cacheados', {
      routes: Object.keys(permissionsState.value?.routes ?? {})
    })
  }

  const canView = hasViewPermission(permissionsState.value, matchedRoute.id)
  console.info('[auth.middleware] permission check', {
    routeId: matchedRoute.id,
    canView
  })

  if (!canView) {
    console.warn('[auth.middleware] acceso denegado por permisos', { to: to.path, routeId: matchedRoute.id })
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: `No tienes permiso para ver esta ruta (${matchedRoute.url})`
      })
    )
  }

  console.info('[auth.middleware] acceso permitido', { to: to.path, routeId: matchedRoute.id })
})