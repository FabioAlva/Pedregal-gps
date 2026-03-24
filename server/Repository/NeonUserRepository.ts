import { eq } from 'drizzle-orm'
import type { IUserRepository } from './Interfaces/IUserRepository'
import type { DbClient } from '~~/shared/types/db'
import * as schema from '~~/server/db/schema'

export class NeonUserRepository implements IUserRepository {
  constructor(private db: DbClient) {}

  async findAll() {
    return await this.db.query.user.findMany()
  }

  async findById(id: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, id)
    })
  }

  async update(id: string, data: { name: string; email: string }) {
    await this.db.update(schema.user)
      .set({
        name: data.name,
        email: data.email
      })
      .where(eq(schema.user.id, id))
  }
}
