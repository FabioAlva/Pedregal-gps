import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewImplement } from '#shared/types/db'
import { NeonImplementRepository } from '../../Repository/NeonImplementRepository'

export class ImplementService {
  private repo: NeonImplementRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonImplementRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async getById(id: number) {
    return await this.repo.findById(id)
  }

  async create(data: NewImplement) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewImplement>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
