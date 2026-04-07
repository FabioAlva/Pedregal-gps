import { asc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewOperator } from '#shared/types/db'
import type { IOperatorRepository } from './Interfaces/IOperatorRepository'

export class NeonOperatorRepository implements IOperatorRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAll(includeInactive = false) {
    const base = this.db.select().from(schema.operators)
    return await (includeInactive
      ? base.orderBy(asc(schema.operators.apellidos))
      : base.where(eq(schema.operators.activo, true)).orderBy(asc(schema.operators.apellidos)))
  }

  async findById(id: number) {
    return await this.db.query.operators.findFirst({
      where: eq(schema.operators.id, id)
    })
  }

  async create(data: NewOperator): Promise<number> {
    const [result] = await this.db
      .insert(schema.operators)
      .values(data)
      .returning({ id: schema.operators.id })

    if (!result?.id) throw new Error('Error al crear el operador')
    return result.id
  }

  async update(id: number, data: Partial<NewOperator>): Promise<void> {
    await this.db.update(schema.operators)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.operators.id, id))
  }

  async deactivate(id: number): Promise<void> {
    await this.db.update(schema.operators)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(schema.operators.id, id))
  }
}
