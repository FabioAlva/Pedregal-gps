import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewImplement } from '#shared/types/db'
import type { IImplementRepository } from './Interfaces/IImplementRepository'

export class NeonImplementRepository implements IImplementRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.implementsTable)
      .orderBy(desc(schema.implementsTable.createdAt))
  }

  async findById(id: number) {
    return await this.db.query.implementsTable.findFirst({
      where: eq(schema.implementsTable.id, id)
    })
  }

  async create(data: NewImplement): Promise<number> {
    const [result] = await this.db
      .insert(schema.implementsTable)
      .values(data)
      .returning({ id: schema.implementsTable.id })

    if (!result?.id) throw new Error('Error al crear implemento')
    return result.id
  }

  async update(id: number, data: Partial<NewImplement>): Promise<void> {
    await this.db
      .update(schema.implementsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.implementsTable.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.implementsTable)
      .where(eq(schema.implementsTable.id, id))
  }
}
