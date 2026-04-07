import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewFleetExpense } from '#shared/types/db'
import type { IExpenseRepository } from './Interfaces/IExpenseRepository'

export class NeonExpenseRepository implements IExpenseRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async getAll() {
    return await this.db
      .select()
      .from(schema.fleetExpenses)
      .orderBy(desc(schema.fleetExpenses.fecha))
  }

  async create(data: NewFleetExpense): Promise<number> {
    const [result] = await this.db
      .insert(schema.fleetExpenses)
      .values(data)
      .returning({ id: schema.fleetExpenses.id })

    if (!result?.id) throw new Error('Error al crear gasto')
    return result.id
  }

  async update(id: number, data: Partial<NewFleetExpense>): Promise<void> {
    await this.db
      .update(schema.fleetExpenses)
      .set(data)
      .where(eq(schema.fleetExpenses.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(schema.fleetExpenses)
      .where(eq(schema.fleetExpenses.id, id))
  }
}
