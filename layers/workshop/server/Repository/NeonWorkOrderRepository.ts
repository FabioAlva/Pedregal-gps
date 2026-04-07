import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewMaintenanceLog } from '#shared/types/db'
import type { IWorkOrderRepository } from './Interfaces/IWorkOrderRepository'

export class NeonWorkOrderRepository implements IWorkOrderRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.maintenanceLogs)
      .orderBy(desc(schema.maintenanceLogs.fecha))
  }

  async create(data: NewMaintenanceLog): Promise<number> {
    const [result] = await this.db
      .insert(schema.maintenanceLogs)
      .values(data)
      .returning({ id: schema.maintenanceLogs.id })

    if (!result?.id) throw new Error('Error al crear orden')
    return result.id
  }

  async update(id: number, data: Partial<NewMaintenanceLog>): Promise<void> {
    await this.db
      .update(schema.maintenanceLogs)
      .set(data)
      .where(eq(schema.maintenanceLogs.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.maintenanceLogs)
      .where(eq(schema.maintenanceLogs.id, id))
  }
}
