import { NeonGeofenceRepository } from '../../Repository/NeonGeofenceRepository'
import type * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewGeofence } from '~~/shared/types/db'

export class GeofenceService {
  private repo: NeonGeofenceRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonGeofenceRepository(db)
  }

  async create(data: NewGeofence) {
    return await this.repo.create(data)
  }

  async getAll() {
    return await this.repo.findAllActives()
  }

  async getById(id: number) {
    return await this.repo.findById(id)
  }

  async update(id: number, data: Partial<NewGeofence>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
