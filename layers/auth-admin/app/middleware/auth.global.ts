import type { FrontPermissionPayload } from "#layers/auth-admin/app/utils/route-permissions";
import {
  hasViewPermission,
  resolveRouteByPath,
} from "#layers/auth-admin/app/utils/route-permissions";

export default defineNuxtRouteMiddleware(async (to) => {
  const headers = useRequestHeaders(["cookie"]) as Record<string, string>;
  /*Envia la url , se normaliza y ve si tiene reglas o no */
  const matchedRoute = await resolveRouteByPath(to.path, headers);
  /* Si la ruta no requiere protección, se permite el acceso sin verificar permisos */
  if (!matchedRoute?.id) {
    return;
  }
  /* Recupera los permisos del storage , sino hay retorna null*/
  const permissionsState = useState<FrontPermissionPayload | null>(
    "auth:my-permissions",
    () => null,
  );

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

  const canView = hasViewPermission(permissionsState.value, matchedRoute.id);
  if (!canView) {
    // Creamos una cookie que dure solo 10 segundos
    const deniedCookie = useCookie("auth_denied_msg", { maxAge: 10 });
    deniedCookie.value = `No tienes permiso para acceder a ${matchedRoute.url}`;
    return navigateTo("/", { replace: true });
  }
});
