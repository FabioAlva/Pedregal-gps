import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInventoryPart } from '#shared/types/db'
import { NeonInventoryPartRepository } from '../../Repository/NeonInventoryPartRepository'

export class InventoryPartService {
  private repo: NeonInventoryPartRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonInventoryPartRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewInventoryPart) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewInventoryPart>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
