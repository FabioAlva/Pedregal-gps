import { eq, and } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewGeofence } from '~~/shared/types/db'
import type { IGeofenceRepository } from './Interfaces/IGeofenceRepository'

export class NeonGeofenceRepository implements IGeofenceRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAllActives() {
    return await this.db.select()
      .from(schema.geofences)
      .where(eq(schema.geofences.isActive, true))
  }

  async findById(id: number) {
    return await this.db.query.geofences.findFirst({
      where: and(
        eq(schema.geofences.id, id),
        eq(schema.geofences.isActive, true)
      )
    })
  }

  async create(data: NewGeofence): Promise<number> {
    const [result] = await this.db.insert(schema.geofences)
      .values(data)
      .returning({ id: schema.geofences.id })

    if (!result) throw new Error('Error al crear la geocerca')

    return result.id
  }

  async delete(id: number): Promise<void> {
    await this.db.update(schema.geofences)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(schema.geofences.id, id))
  }

  async update(id: number, data: Partial<NewGeofence>): Promise<void> {
    await this.db.update(schema.geofences)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.geofences.id, id))
  }
}
