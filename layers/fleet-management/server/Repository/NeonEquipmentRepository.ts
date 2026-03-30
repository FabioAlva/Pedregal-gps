import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewEquipment } from '~~/shared/types/db'
import type { IEquipmentRepository } from './Interfaces/IEquipmentRepository'

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
    
    if (!result) throw new Error('Error al registrar equipo')
    return result.id
  }

async update(id: number, data: Partial<NewEquipment>): Promise<void> {

  const { createdAt, updatedAt, ...cleanData } = data
    await this.db.update(schema.equipment)
      .set({ ...cleanData, updatedAt: new Date() })
      .where(eq(schema.equipment.id, id))
  }

  // Implementación requerida por la interfaz
  async updateState(id: number, state: number): Promise<void> {
    // Aquí mapeamos 'state' al campo de tu tabla (ej: estadoId)
    await this.update(id, { estadoId: state } as any) 
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(schema.equipment)
      .where(eq(schema.equipment.id, id))
  }
}