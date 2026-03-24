import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewEquipment } from '#shared/types/db'
import type { IEquipmentRepository } from './Interfaces/IEquipmentRepository'

import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export class NeonEquipmentRepository implements IEquipmentRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.query.equipment.findMany()
  }

  async findById(id: number) {
    return await this.db.query.equipment.findFirst({
      where: eq(schema.equipment.id, id)
    })
  }

  async create(data: NewEquipment) {
    const [result] = await this.db.insert(schema.equipment)
      .values(data)
      .returning({ id: schema.equipment.id })
    if (!result) throw new Error('Error al crear la geocerca')
    return result.id
  }

  async updateState(id: number, estadoId: number) {
    await this.db.update(schema.equipment)
      .set({ estadoId, updatedAt: new Date() })
      .where(eq(schema.equipment.id, id))
  }

  /* Evaluar luego la posibilidad de hacerlo a nivel de estado  */
  async delete(id: number) {
    await this.db.delete(schema.equipment)
      .where(eq(schema.equipment.id, id))
  }
}
