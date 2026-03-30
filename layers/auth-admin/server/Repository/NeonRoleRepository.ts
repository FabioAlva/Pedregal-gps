import { and, eq } from 'drizzle-orm'
import type { IRoleRepository, RoleRoutePermissionInput, RoleRoutePermissionView } from './Interfaces/IRoleRepository'
import type { DbClient, NewRole, Role } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'

export class NeonRoleRepository implements IRoleRepository {
  constructor(private db: DbClient) {}

  async findAll(): Promise<Role[]> {
    return await this.db.query.roles.findMany({
      where: eq(schema.roles.activo, true)
    })
  }

  async findById(id: number): Promise<Role | undefined> {
    return await this.db.query.roles.findFirst({
      where: and(eq(schema.roles.id, id), eq(schema.roles.activo, true))
    })
  }

  async create(data: NewRole): Promise<number> {
    const [result] = await this.db.insert(schema.roles)
      .values(data)
      .returning({ id: schema.roles.id })

    if (!result) throw new Error('Error al crear el rol')
    return result.id
  }

  async update(id: number, data: Partial<NewRole>): Promise<void> {
    await this.db.update(schema.roles)
      .set(data)
      .where(eq(schema.roles.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db.update(schema.roles)
      .set({ activo: false })
      .where(eq(schema.roles.id, id))
  }

  async getRoleRoutePermissions(roleId: number): Promise<RoleRoutePermissionView[]> {
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
      .innerJoin(
        schema.moduleRoutes, 
        eq(schema.moduleRoutes.id, schema.roleRoutePermissions.rutaModuloId)
      )
      .where(eq(schema.roleRoutePermissions.rolId, roleId))
  }

  /*Se eliminan las relaciones antiguas y se insertan las nuevas , con una transacción en caso falle */
async updateRoleRoutePermissions(roleId: number, permissions: RoleRoutePermissionInput[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(schema.roleRoutePermissions)
      .where(eq(schema.roleRoutePermissions.rolId, roleId))
      if (permissions.length === 0) return
      await tx.insert(schema.roleRoutePermissions).values(
        permissions.map(p => ({
          rolId: roleId,
          rutaModuloId: p.rutaModuloId,
          ver: Boolean(p?.ver),
          agregar: Boolean(p?.agregar),
          editar: Boolean(p?.editar),
          eliminar: Boolean(p?.eliminar)
        }))
      )
    })
  }
}