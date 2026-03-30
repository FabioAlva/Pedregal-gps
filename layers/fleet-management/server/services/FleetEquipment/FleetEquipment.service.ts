import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { NewFleetEquipment } from '~~/shared/types/db'
import { NeonFleetEquipmentRepository } from '../../Repository/NeonFleetEquipmentRepository'

export class FleetEquipmentService {
  private readonly repo: NeonFleetEquipmentRepository

  constructor(private readonly db: NeonHttpDatabase<typeof schema>) {
    // Solo un repositorio, cumpliendo con tu visión
    this.repo = new NeonFleetEquipmentRepository(this.db)
  }

  async createAssignment(data: NewFleetEquipment) {
    // La lógica de actualización de estado ya ocurre dentro del repo (vía transacción)
    return await this.repo.create(data)
  }

  async getAllAssignments() {
    return await this.repo.getAssignments()
  }

  async getActiveAssignments() {
    return await this.repo.getActiveAssignments()
  }

  async updateAssignment(id: number, data: Partial<NewFleetEquipment>) {
    return await this.repo.update(id, data)
  }

  async getActiveByGpsId(idGps: string) {
    return await this.repo.getActiveByGpsId(idGps)
  }
}