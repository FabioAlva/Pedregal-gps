import { and, eq, inArray } from 'drizzle-orm'
import type { IUserRepository, IUserRoleWithRole } from './Interfaces/IUserRepository'
import type { DbClient, User } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'

export class NeonUserRepository implements IUserRepository {
  constructor(private db: DbClient) {}

  async findAll(): Promise<User[]> {
    return await this.db.query.user.findMany()
  }

  async findById(id: string): Promise<User | undefined> {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, id)
    })
  }

  async update(id: string, data: { name: string; email: string }): Promise<void> {
    await this.db.update(schema.user)
      .set({ name: data.name, email: data.email })
      .where(eq(schema.user.id, id))
  }

  // --- Roles del Usuario (Lógica Migrada) ---
  async findUserRoles(userId: string): Promise<IUserRoleWithRole[]> {
    return await this.db
      .select({
        userId: schema.userRoles.userId,
        rolId: schema.userRoles.rolId,
        rolNombre: schema.roles.nombre,
        asignadoEl: schema.userRoles.asignadoEl
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.rolId))
      .where(and(
        eq(schema.userRoles.userId, userId), 
        eq(schema.roles.activo, true)
      ))
  }

  async setUserRoles(userId: string, roleIds: number[]): Promise<void> {
    // Usamos una transacción para asegurar integridad
    await this.db.transaction(async (tx) => {
      // 1. Limpiamos roles actuales
      await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId))

      if (roleIds.length === 0) return

      // 2. Validamos que los nuevos roles existan y estén activos
      const uniqueRoleIds = [...new Set(roleIds)]
      const existingRoles = await tx.query.roles.findMany({
        where: and(
          inArray(schema.roles.id, uniqueRoleIds), 
          eq(schema.roles.activo, true)
        )
      })

      if (existingRoles.length !== uniqueRoleIds.length) {
        throw createError({ 
          statusCode: 400, 
          statusMessage: 'Uno o más roles seleccionados no son válidos o están inactivos' 
        })
      }

      // 3. Insertamos los nuevos roles
      await tx.insert(schema.userRoles).values(
        uniqueRoleIds.map(rolId => ({ userId, rolId }))
      )
    })
  }
}