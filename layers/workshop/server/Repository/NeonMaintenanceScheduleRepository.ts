import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewMaintenanceSchedule } from '#shared/types/db'
import type { IMaintenanceScheduleRepository } from './Interfaces/IMaintenanceScheduleRepository'

export class NeonMaintenanceScheduleRepository implements IMaintenanceScheduleRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.maintenanceSchedules)
      .orderBy(desc(schema.maintenanceSchedules.createdAt))
  }

  async create(data: NewMaintenanceSchedule): Promise<number> {
    const [result] = await this.db
      .insert(schema.maintenanceSchedules)
      .values(data)
      .returning({ id: schema.maintenanceSchedules.id })

    if (!result?.id) throw new Error('Error al crear mantenimiento')
    return result.id
  }

  async update(id: number, data: Partial<NewMaintenanceSchedule>): Promise<void> {
    await this.db
      .update(schema.maintenanceSchedules)
      .set(data)
      .where(eq(schema.maintenanceSchedules.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.maintenanceSchedules)
      .where(eq(schema.maintenanceSchedules.id, id))
  }
}
