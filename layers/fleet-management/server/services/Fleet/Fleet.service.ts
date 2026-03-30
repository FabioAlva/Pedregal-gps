import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import { NeonFleetRepository } from '../../Repository/NeonFleetRepository'

export class FleetService {
  private repo: NeonFleetRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonFleetRepository(db)
  }

  /* --- Métodos de Lectura --- */

  async getBasicFleets() {
    return await this.repo.getBasic()
  }

  async getAvailableFleets(includePlate?: string) {
    return await this.repo.getAvailable(includePlate)
  }

  async getAllFleets() {
    return await this.repo.getAll()
  }

  async findFleetById(id: number) {
    return await this.repo.findById(id)
  }

  /* --- Métodos de Escritura --- */

  async createFleet(data: any) {
    return await this.repo.create(data)
  }

  async updateFleet(id: number, data: any) {
    return await this.repo.update(id, data)
  }

  async deleteFleet(id: number) {
    return await this.repo.delete(id)
  }
}