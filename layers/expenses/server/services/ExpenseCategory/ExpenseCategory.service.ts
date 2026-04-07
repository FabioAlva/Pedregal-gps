import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewExpenseCategory } from '#shared/types/db'
import { NeonExpenseCategoryRepository } from '../../Repository/NeonExpenseCategoryRepository'

export class ExpenseCategoryService {
  private repo: NeonExpenseCategoryRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonExpenseCategoryRepository(db)
  }

  async getAll() {
    return await this.repo.getAll()
  }

  async create(data: NewExpenseCategory) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewExpenseCategory>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
