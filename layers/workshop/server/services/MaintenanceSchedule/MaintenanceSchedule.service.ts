import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewMaintenanceSchedule } from '#shared/types/db'
import { NeonMaintenanceScheduleRepository } from '../../Repository/NeonMaintenanceScheduleRepository'

export class MaintenanceScheduleService {
  private repo: NeonMaintenanceScheduleRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonMaintenanceScheduleRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewMaintenanceSchedule) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewMaintenanceSchedule>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
