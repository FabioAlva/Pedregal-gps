import type { IRoleRepository } from './Interfaces/IRoleRepository'
import type { DbClient, NewRole } from '~~/shared/types/db'
import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export class NeonRoleRepository implements IRoleRepository {
  constructor(private db: DbClient) {}

  async findAll() {
    return await this.db.query.roles.findMany({
      where: eq(schema.roles.activo, true)
    })
  }

  async findById(id: number) {
    return await this.db.query.roles.findFirst({
      where: and(eq(schema.roles.id, id), eq(schema.roles.activo, true))
    })
  }

  async create(data: NewRole) {
    const [result] = await this.db.insert(schema.roles)
      .values(data)
      .returning({ id: schema.roles.id })

    if (!result) throw new Error('Error al crear el rol')
    return result.id
  }

  async update(id: number, data: Partial<NewRole>) {
    await this.db.update(schema.roles)
      .set(data)
      .where(eq(schema.roles.id, id))
  }

  async delete(id: number) {
    await this.db.update(schema.roles)
      .set({ activo: false })
      .where(eq(schema.roles.id, id))
  }
}
