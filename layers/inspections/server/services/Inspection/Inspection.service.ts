import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewInspection } from '#shared/types/db'
import type { InspectionIssueInput } from '../../Repository/Interfaces/IInspectionRepository'
import { NeonInspectionRepository } from '../../Repository/NeonInspectionRepository'

export class InspectionService {
  private repo: NeonInspectionRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonInspectionRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async getById(id: number) {
    return await this.repo.getById(id)
  }

  async create(data: NewInspection, issues: InspectionIssueInput[] = []) {
    return await this.repo.create(data, issues)
  }
}
