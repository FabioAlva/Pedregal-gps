import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInventoryPart } from '#shared/types/db'
import type { IInventoryPartRepository } from './Interfaces/IInventoryPartRepository'

export class NeonInventoryPartRepository implements IInventoryPartRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.inventoryParts)
      .orderBy(desc(schema.inventoryParts.createdAt))
  }

  async create(data: NewInventoryPart): Promise<number> {
    const [result] = await this.db
      .insert(schema.inventoryParts)
      .values(data)
      .returning({ id: schema.inventoryParts.id })

    if (!result?.id) throw new Error('Error al crear repuesto')
    return result.id
  }

  async update(id: number, data: Partial<NewInventoryPart>): Promise<void> {
    await this.db
      .update(schema.inventoryParts)
      .set(data)
      .where(eq(schema.inventoryParts.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.inventoryParts)
      .where(eq(schema.inventoryParts.id, id))
  }
}
