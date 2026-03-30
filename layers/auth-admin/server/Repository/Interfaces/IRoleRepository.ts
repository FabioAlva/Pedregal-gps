export interface RoleRoutePermissionInput {
  rutaModuloId: number
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

export type RoutePermission = {
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

export type PermissionAction = 'ver' | 'agregar' | 'editar' | 'eliminar'

export type RoutePermissionMap = Record<number, RoutePermission>

export type PermissionPayload = {
  routes: RoutePermissionMap
}
export interface RoleRoutePermissionView {
  id: number
  rolId: number
  rutaModuloId: number
  rutaNombre: string
  rutaUrl: string
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

export interface IRoleRepository {
  findAll(): Promise<Role[]>
  findById(id: number): Promise<Role | undefined>
  create(data: NewRole): Promise<number>
  update(id: number, data: Partial<NewRole>): Promise<void>
  delete(id: number): Promise<void>
  getRoleRoutePermissions(roleId: number): Promise<RoleRoutePermissionView[]>
  updateRoleRoutePermissions(roleId: number, permissions: RoleRoutePermissionInput[]): Promise<void>
}