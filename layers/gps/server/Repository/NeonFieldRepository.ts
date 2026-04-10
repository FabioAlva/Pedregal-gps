import { eq, and } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewField } from '~~/shared/types/db'
import type { IFieldRepository } from './Interfaces/IFieldRepository'

export class NeonFieldRepository implements IFieldRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAllActives() {
    return await this.db.select()
      .from(schema.fields)
      .where(eq(schema.fields.activo, true))
  }

  async findById(id: number) {
    return await this.db.query.fields.findFirst({
      where: and(
        eq(schema.fields.id, id),
        eq(schema.fields.activo, true)
      )
    })
  }

  async create(data: NewField): Promise<number> {
    const [result] = await this.db.insert(schema.fields)
      .values(data)
      .returning({ id: schema.fields.id })

    if (!result) throw new Error('Error al crear el campo')

    return result.id
  }

  async delete(id: number): Promise<void> {
    await this.db.update(schema.fields)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(schema.fields.id, id))
  }

  async update(id: number, data: Partial<NewField>): Promise<void> {
    await this.db.update(schema.fields)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.fields.id, id))
  }
}
