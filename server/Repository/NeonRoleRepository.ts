import { and, eq } from 'drizzle-orm'
import type { IRoleRepository, RoleRoutePermissionInput, RoleRoutePermissionView } from './Interfaces/IRoleRepository'
import type { DbClient, NewRole, Role } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'

export class NeonRoleRepository implements IRoleRepository {
  constructor(private db: DbClient) {}

  // --- Gestión de Roles ---
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
    // Soft delete para mantener integridad referencial
    await this.db.update(schema.roles)
      .set({ activo: false })
      .where(eq(schema.roles.id, id))
  }

  // --- Gestión de Permisos (Lógica Migrada) ---
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

  
async updateRoleRoutePermissions(roleId: number, permissions: RoleRoutePermissionInput[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. Limpieza radical
      await tx.delete(schema.roleRoutePermissions)
        .where(eq(schema.roleRoutePermissions.rolId, roleId))

      if (permissions.length === 0) return

      // LOG: Verificar payload completo antes de insertar
      console.log('💾 [REPO SAVE] Array completo de permisos a insertar:', JSON.stringify(permissions, null, 2));
      permissions.forEach(p => {
        console.log(`🔎 [REPO LOG] rutaModuloId: ${p.rutaModuloId}, ver: ${!!p.ver}, agregar: ${!!p.agregar}, editar: ${!!p.editar}, eliminar: ${!!p.eliminar}`);
      });
      // 2. Inserción blindada
      await tx.insert(schema.roleRoutePermissions).values(
        permissions.map(p => ({
          rolId: roleId,
          rutaModuloId: p.rutaModuloId,
          // Forzamos que si viene undefined o null, sea false
          ver: !!p.ver,
          agregar: !!p.agregar,
          editar: !!p.editar,
          eliminar: !!p.eliminar
        }))
      )
    })
    console.log(`✅ [REPO] Permisos actualizados en DB para el rol ${roleId}`);
  }
}