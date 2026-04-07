import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInspectionTemplate } from '#shared/types/db'
import { NeonInspectionTemplateRepository } from '../../Repository/NeonInspectionTemplateRepository'

export class InspectionTemplateService {
  private repo: NeonInspectionTemplateRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonInspectionTemplateRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewInspectionTemplate) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewInspectionTemplate>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
