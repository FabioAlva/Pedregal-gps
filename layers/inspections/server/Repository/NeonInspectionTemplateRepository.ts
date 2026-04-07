import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInspectionTemplate } from '#shared/types/db'
import type { IInspectionTemplateRepository } from './Interfaces/IInspectionTemplateRepository'

export class NeonInspectionTemplateRepository implements IInspectionTemplateRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.inspectionTemplates)
      .orderBy(desc(schema.inspectionTemplates.createdAt))
  }

  async create(data: NewInspectionTemplate): Promise<number> {
    const [result] = await this.db
      .insert(schema.inspectionTemplates)
      .values(data)
      .returning({ id: schema.inspectionTemplates.id })

    if (!result?.id) throw new Error('Error al crear plantilla')
    return result.id
  }

  async update(id: number, data: Partial<NewInspectionTemplate>): Promise<void> {
    await this.db
      .update(schema.inspectionTemplates)
      .set(data)
      .where(eq(schema.inspectionTemplates.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.inspectionTemplates)
      .where(eq(schema.inspectionTemplates.id, id))
  }
}
