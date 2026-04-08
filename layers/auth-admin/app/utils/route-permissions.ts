// export interface FrontPermissionActions {
//   ver: boolean
//   agregar: boolean
//   editar: boolean
//   eliminar: boolean
// }
// export type FrontRoutePermissionMap = Record<number, FrontPermissionActions>
// export interface FrontPermissionPayload {
//   routes: FrontRoutePermissionMap
// }
// export interface FrontModuleRouteRule {
//   id: number
//   url: string
//   tipoRuta: 'frontend' | 'backend'
//   protegida: boolean
// }

// let cachedModuleRouteRules: FrontModuleRouteRule[] | null = null
// let moduleRouteRulesPromise: Promise<FrontModuleRouteRule[]> | null = null

// /*Normaliza las rutas */
// function normalizePath(path: string): string {
//   const trimmed = path.trim()
//   /*Si esta vacía , retorna '/' */
//   if (!trimmed) return '/'
//   /* Si no comienza con '/', lo agrega*/
//   const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
//   /* Elimina barras al final, pero si la ruta es solo '/', la deja como está */
//   return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
// }

// function normalizeRules(rules: FrontModuleRouteRule[] | null | undefined): FrontModuleRouteRule[] {
//   return (rules ?? [])
//      // filtra las reglas para quedarse solo con las que tienen id, url, son protegidas y de tipo frontend
//     .filter(rule => Boolean(rule.id && rule.url) && rule.protegida === true && rule.tipoRuta === 'frontend')
//     // normaliza las urls de las reglas
//     .map(rule => ({
//       ...rule,
//       url: normalizePath(rule.url)
//     }))
//     // ordena las reglas por longitud de url de mayor a menor para asegurar que las rutas más específicas se evalúen primero
//     .sort((a, b) => b.url.length - a.url.length)
// }


// export async function loadModuleRouteRules(headers?: Record<string, string>): Promise<FrontModuleRouteRule[]> {// Si ya tenemos reglas cacheadas, las retornamos
//   if (cachedModuleRouteRules) return cachedModuleRouteRules
// // Si ya hay una promesa en curso para cargar las reglas, esperamos esa promesa
//   if (moduleRouteRulesPromise) return await moduleRouteRulesPromise
  
//   // intenta cargar el storedo en localStorage para evitar una solicitud si ya se cargaron las reglas en esta sesión
//   if (import.meta.client) {
//     const stored = localStorage.getItem('module-route-rules')
//     if (stored) {
//       cachedModuleRouteRules = JSON.parse(stored)
//       return cachedModuleRouteRules!
//     }
//   }

  
//   moduleRouteRulesPromise = (async () => {
//     try {
//       /* Envia una solicitud al archivo server/api/module-routes/index.get.ts 
//       y obtiene todas las rutas de los módulos, luego normaliza y cachea esas reglas para su uso posterior */      
// const rows = await $fetch<FrontModuleRouteRule[]>('/api/module-routes', { headers })      /*Normaliza y ordena */
//       cachedModuleRouteRules = normalizeRules(rows)
//       /*Si no encuentra reglas devuelve un array vacío */
//       if (cachedModuleRouteRules.length === 0) cachedModuleRouteRules = []
//       /*Guarda en cache */
//        if (import.meta.client) {
//         localStorage.setItem('module-route-rules', JSON.stringify(cachedModuleRouteRules))
//       }
     
//       return cachedModuleRouteRules
//     } catch {
//       cachedModuleRouteRules = []
//       return cachedModuleRouteRules
//     } finally {
//       moduleRouteRulesPromise = null
//     }
//   })()
//   return await moduleRouteRulesPromise
// }


// export async function resolveRouteByPath(path: string, headers?: Record<string, string>): Promise<FrontModuleRouteRule | null> {
//    /* Normaliza la ruta */
//   const normalizedPath = normalizePath(path)
//   /*Carga las reglas de la cache o mediante una solicitud */
//   const rules = await loadModuleRouteRules(headers)
//   /* Busca la regla que coincida con la ruta normalizada */
//   const rule = rules.find((candidate) => {
//       /* Si la regla candidata es '/', solo coincide si la ruta normalizada también es '/' */
//     if (candidate.url === '/') return normalizedPath === '/'
//       /* Para otras reglas, coincide si la ruta normalizada es exactamente igual a la url de la regla o 
//       si comienza con la url de la regla seguida de una barra (lo que indica una subruta) */
//     return normalizedPath === candidate.url || normalizedPath.startsWith(`${candidate.url}/`)
//   })
//   return rule ?? null
// }

// export function hasViewPermission(
//   permissionPayload: FrontPermissionPayload | null,
//   routeId: number
// ): boolean {
//   // Si no hay permisos, no se puede ver nada
//   if (!permissionPayload) return false
//   // Busca los permisos específicos para la ruta dada por su ID
//   const routePermissions = permissionPayload.routes?.[routeId]
//   // Retorna true si el permiso de 'ver' es explícitamente true, de lo contrario retorna false
//   return routePermissions?.ver === true
// }
