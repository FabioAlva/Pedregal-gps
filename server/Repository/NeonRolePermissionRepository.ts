import { eq } from 'drizzle-orm'
import type { DbClient } from '~~/shared/types/db'
import type {
  IRolePermissionRepository,
  RoleRoutePermissionInput,
  RoleRoutePermissionView
} from './Interfaces/IRolePermissionRepository'
import * as schema from '~~/server/db/schema'

export class NeonRolePermissionRepository implements IRolePermissionRepository {
  constructor(private db: DbClient) {}

  async findRoutePermissionsByRoleId(rolId: number): Promise<RoleRoutePermissionView[]> {
    return await this.db
      .select({
        id: schema.roleRoutePermissions.id,
        rolId: schema.roleRoutePermissions.rolId,
        rutaModuloId: schema.roleRoutePermissions.rutaModuloId,
        rutaNombre: schema.moduleRoutes.nombre,
        rutaUrl: schema.moduleRoutes.url,
        ver: schema.roleRoutePermissions.ver,
        agregar: schema.roleRoutePermissions.agregar,
        editar: schema.roleRoutePermissions.editar,
        eliminar: schema.roleRoutePermissions.eliminar
      })
      .from(schema.roleRoutePermissions)
      .innerJoin(schema.moduleRoutes, eq(schema.moduleRoutes.id, schema.roleRoutePermissions.rutaModuloId))
      .where(eq(schema.roleRoutePermissions.rolId, rolId))
  }

  async replaceRoutePermissionsByRole(rolId: number, permissions: RoleRoutePermissionInput[]) {
    await this.db.delete(schema.roleRoutePermissions)
      .where(eq(schema.roleRoutePermissions.rolId, rolId))

    if (permissions.length === 0) return

    await this.db.insert(schema.roleRoutePermissions).values(
      permissions.map(permission => ({
        rolId,
        rutaModuloId: permission.rutaModuloId,
        ver: permission.ver,
        agregar: permission.agregar,
        editar: permission.editar,
        eliminar: permission.eliminar
      }))
    )
  }
}
