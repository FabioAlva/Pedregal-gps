export interface RoleRoutePermissionInput {
  rutaModuloId: number
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
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

export interface IRolePermissionRepository {
  findRoutePermissionsByRoleId(rolId: number): Promise<RoleRoutePermissionView[]>
  replaceRoutePermissionsByRole(rolId: number, permissions: RoleRoutePermissionInput[]): Promise<void>
}
