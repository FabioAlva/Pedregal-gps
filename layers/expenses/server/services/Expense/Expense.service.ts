import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewFleetExpense } from '#shared/types/db'
import { NeonExpenseRepository } from '../../Repository/NeonExpenseRepository'

export class ExpenseService {
  private repo: NeonExpenseRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonExpenseRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewFleetExpense) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewFleetExpense>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
