import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewOperator } from '#shared/types/db'
import { NeonOperatorRepository } from '../../Repository/NeonOperatorRepository'

export class OperatorService {
  private repo: NeonOperatorRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonOperatorRepository(db)
  }

  async getAll(includeInactive = false) {
    return await this.repo.findAll(includeInactive)
  }

  async getById(id: number) {
    return await this.repo.findById(id)
  }

  async create(data: NewOperator) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewOperator>) {
    return await this.repo.update(id, data)
  }

  async deactivate(id: number) {
    return await this.repo.deactivate(id)
  }
}
