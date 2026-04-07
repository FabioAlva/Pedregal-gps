import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewMaintenanceLog } from '#shared/types/db'
import { NeonWorkOrderRepository } from '../../Repository/NeonWorkOrderRepository'

export class WorkOrderService {
  private repo: NeonWorkOrderRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonWorkOrderRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewMaintenanceLog) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewMaintenanceLog>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
