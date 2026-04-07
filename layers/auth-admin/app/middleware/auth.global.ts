import type { FrontPermissionPayload } from "~~/layers/auth-admin/app/utils/navigation-map";
import {
  getNavigationMap,
  matchCurrentView,
  canUserView,
} from "~~/layers/auth-admin/app/utils/navigation-map";

export default defineNuxtRouteMiddleware(async (to) => {


  /* Rutas Publicas*/
  const publicRoutes = ['/', '/login', '/public'];
  if (publicRoutes.includes(to.path)) {
    return;
  }
  
  /* Obtiene los encabezados de la solicitud */
  const headers = useRequestHeaders(["cookie"]) as Record<string, string>;
  
  /* Resuelve la ruta por su path */
  const matchedRoute = await matchCurrentView(to.path, headers);
  
    if (!matchedRoute?.id) {
      return
      //abortNavigation(createError({ statusCode: 403, message: 'Ruta no registrada' }))
    }

    if (matchedRoute.protegida === false) {
      return
    }
  
  /* Recupera los permisos del storage , sino hay retorna null*/
  const permissionsState = useState<FrontPermissionPayload | null>(
    "auth:my-permissions",
    () => null,
  );

  const resolveFirstAllowedRoute = async () => {
    const map = await getNavigationMap(headers)
    return map.find(route => canUserView(permissionsState.value, route.id))?.url ?? null
  }

  /*Evalua si hay permisos cacheados disponibles */
  const hasUsableCachedPermissions = Boolean(
    permissionsState.value &&
    Object.keys(permissionsState.value.routes ?? {}).length > 0,
  );

  /*Sino los trae del endpoint auth/mis-permisos */
  if (!hasUsableCachedPermissions) {
    try {
      permissionsState.value = await $fetch<FrontPermissionPayload>(
        "/api/auth/mis-permisos",
        {
          headers,
        },
      );
    } catch (error: any) {
      if (error?.statusCode === 401) {
        permissionsState.value = null;

        console.warn(
          "[auth.middleware] sin sesion valida, redirigiendo a /login",
          { to: to.path },
        );
        return navigateTo("/login");
      }

      console.error("[auth.middleware] fallo cargando permisos", {
        statusCode: error?.statusCode,
        statusMessage: error?.statusMessage,
        data: error?.data,
        message: error?.message,
      });

      return abortNavigation(
        createError({
          statusCode: 403,
          statusMessage: "No se pudieron validar permisos",
        }),
      );
    }
  }

  const canView = canUserView(permissionsState.value, matchedRoute.id);
  if (!canView) {
    const deniedCookie = useCookie("auth_denied_msg", { maxAge: 10 });
    deniedCookie.value = `No tienes permiso para acceder a ${matchedRoute.url}`;
    const fallback = await resolveFirstAllowedRoute()
    if (fallback && fallback !== to.path) {
      return navigateTo(fallback, { replace: true })
    }
    return navigateTo("/login", { replace: true })
  }

  if (to.path === '/') {
    const fallback = await resolveFirstAllowedRoute()
    if (fallback && fallback !== '/') {
      return navigateTo(fallback, { replace: true })
    }
  }
});
