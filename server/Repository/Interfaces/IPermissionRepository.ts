export type RoutePermission = {
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

export type RoutePermissionMap = Record<number, RoutePermission>

export type PermissionPayload = {
  routes: RoutePermissionMap
}

export type PermissionAction = 'ver' | 'agregar' | 'editar' | 'eliminar'

export interface IPermissionRepository {
  getUserPermissions(userId: string): Promise<PermissionPayload>
  getAuthenticatedUserIdBySessionToken(token: string): Promise<string | undefined>
}
