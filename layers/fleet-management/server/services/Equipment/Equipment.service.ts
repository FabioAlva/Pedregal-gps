import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewEquipment } from '~~/shared/types/db'
import { NeonEquipmentRepository } from '../../Repository/NeonEquipmentRepository'

export class EquipmentService {
  private repo: NeonEquipmentRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonEquipmentRepository(db)
  }

  async registerDevice(data: NewEquipment) {
    return await this.repo.create(data)
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async updateState(id: number, stateId: number) {
    return await this.repo.updateState(id, stateId)
  }

  // Mantenemos los nombres claros según tu repositorio
  async update(id: number, data: Partial<NewEquipment>) {
    return await this.repo.update(id, data)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}