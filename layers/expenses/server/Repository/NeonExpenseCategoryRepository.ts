import { asc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewExpenseCategory } from '#shared/types/db'
import type { IExpenseCategoryRepository } from './Interfaces/IExpenseCategoryRepository'

export class NeonExpenseCategoryRepository implements IExpenseCategoryRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.expenseCategories)
      .orderBy(asc(schema.expenseCategories.nombre))
  }

  async create(data: NewExpenseCategory): Promise<number> {
    const [result] = await this.db
      .insert(schema.expenseCategories)
      .values(data)
      .returning({ id: schema.expenseCategories.id })

    if (!result?.id) throw new Error('Error al crear categoria de gasto')
    return result.id
  }

  async update(id: number, data: Partial<NewExpenseCategory>): Promise<void> {
    await this.db
      .update(schema.expenseCategories)
      .set(data)
      .where(eq(schema.expenseCategories.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.expenseCategories)
      .where(eq(schema.expenseCategories.id, id))
  }
}
