import type { FrontPermissionPayload } from "~/utils/route-permissions";
import {
  hasViewPermission,
  resolveRouteByPath,
} from "~/utils/route-permissions";

export default defineNuxtRouteMiddleware(async (to) => {

  const headers = useRequestHeaders(["cookie"]) as Record<string, string>;
  /*Envia la url , se normaliza y ve si tiene reglas o no */
  const matchedRoute = await resolveRouteByPath(to.path, headers);
  /* Si la ruta no requiere protección, se permite el acceso sin verificar permisos */
  if (!matchedRoute?.id) {
    return;
  }

  /* Recupera los permisos del local storage , sino hay retorna null*/
  const permissionsState = useState<FrontPermissionPayload | null>(
    "auth:my-permissions",
    () => {
      if (import.meta.client) {
        const stored = localStorage.getItem("auth:my-permissions");
        if (stored) return JSON.parse(stored);
      }
      return null;
    },
  );
  
  /*Evalua si hay permisos cacheados disponibles */
  const hasUsableCachedPermissions = Boolean(
    permissionsState.value &&
    Object.keys(permissionsState.value.routes ?? {}).length > 0,
  );
 
  /*Sino los trae del endpoint auth/mis-permisos */
  if (!hasUsableCachedPermissions) {

    try {
      console.info(
        "[auth.middleware] cargando permisos desde /api/auth/mis-permisos",
      );

      permissionsState.value = await $fetch<FrontPermissionPayload>(
        "/api/auth/mis-permisos",
        {
          headers,
        },
      );

      if (!permissionsState.value) {
        console.warn("[auth.middleware] permisos vacios para usuario actual");
      }

      console.info("[auth.middleware] permisos cargados", {
        routes: Object.keys(permissionsState.value?.routes ?? {}),
      });
    } 
    catch (error: any) {
    
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
  }else {
    console.info("[auth.middleware] usando permisos cacheados", {
      routes: Object.keys(permissionsState.value?.routes ?? {}),
    });
  }

  const canView = hasViewPermission(permissionsState.value, matchedRoute.id);
  console.info("[auth.middleware] permission check", {
    routeId: matchedRoute.id,
    canView,
  });

  if (!canView) {
    console.warn("[auth.middleware] acceso denegado por permisos", {
      to: to.path,
      routeId: matchedRoute.id,
    });
    return abortNavigation(
      createError({
        statusCode: 403,
        statusMessage: `No tienes permiso para ver esta ruta (${matchedRoute.url})`,
      }),
    );
  }

  console.info("[auth.middleware] acceso permitido", {
    to: to.path,
    routeId: matchedRoute.id,
  });
});
