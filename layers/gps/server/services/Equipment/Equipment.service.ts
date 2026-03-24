import type { NewEquipment } from '~~/shared/types/db.js'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { NeonEquipmentRepository as NeonEquipmentRepository } from '~~/layers/gps/server/Repository/NeonEquipmentRepository'

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
    const validStates = [1, 2, 3, 4]

    if (!validStates.includes(stateId)) {
      throw new Error('Estado inválido. Los valores permitidos son: 1, 2, 3 o 4.')
    }

    await this.repo.updateState(id, stateId)
  }
}
