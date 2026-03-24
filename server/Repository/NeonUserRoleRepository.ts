import { and, eq, inArray } from 'drizzle-orm'
import type { IUserRoleRepository, IUserRoleWithRole } from './Interfaces/IUserRoleRepository'
import type { DbClient } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'

export class NeonUserRoleRepository implements IUserRoleRepository {
  constructor(private db: DbClient) {}

  async findByUserId(userId: string): Promise<IUserRoleWithRole[]> {
    return await this.db
      .select({
        userId: schema.userRoles.userId,
        rolId: schema.userRoles.rolId,
        rolNombre: schema.roles.nombre,
        asignadoEl: schema.userRoles.asignadoEl
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.rolId))
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.roles.activo, true)))
  }

  async findRoleRowsByUserId(userId: string) {
    return await this.db.query.userRoles.findMany({
      where: eq(schema.userRoles.userId, userId)
    })
  }

  async replaceByUser(userId: string, roleIds: number[]) {
    await this.db.delete(schema.userRoles)
      .where(eq(schema.userRoles.userId, userId))

    if (roleIds.length === 0) return

    const uniqueRoleIds = [...new Set(roleIds)]

    const existingRoles = await this.db.query.roles.findMany({
      where: and(inArray(schema.roles.id, uniqueRoleIds), eq(schema.roles.activo, true))
    })

    if (existingRoles.length !== uniqueRoleIds.length) {
      throw new Error('Uno o más roles no existen')
    }

    await this.db.insert(schema.userRoles).values(
      uniqueRoleIds.map(rolId => ({
        userId,
        rolId
      }))
    )
  }
}
