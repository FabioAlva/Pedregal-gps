import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewGpsAlert } from '#shared/types/db'
import type { IGpsAlertRepository } from './Interfaces/IGpsAlertRepository'

import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export class NeonGpsAlertRepository implements IGpsAlertRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.query.gpsAlerts.findMany()
  }

  async findById(id: number) {
    return await this.db.query.gpsAlerts.findFirst({
      where: eq(schema.gpsAlerts.id, id)
    })
  }

  async create(data: NewGpsAlert) {
    const [result] = await this.db.insert(schema.gpsAlerts)
      .values(data)
      .returning({ id: schema.gpsAlerts.id })
    if (!result) throw new Error('Error al crear la alerta GPS')
    return result.id
  }

  async update(id: number, data: Partial<NewGpsAlert>) {
    await this.db.update(schema.gpsAlerts)
      .set(data)
      .where(eq(schema.gpsAlerts.id, id))
  }

  async updateActive(id: number, activo: boolean) {
    await this.db.update(schema.gpsAlerts)
      .set({ activo })
      .where(eq(schema.gpsAlerts.id, id))
  }

  async delete(id: number) {
    await this.db.delete(schema.gpsAlerts)
      .where(eq(schema.gpsAlerts.id, id))
  }
}