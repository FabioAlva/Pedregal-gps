import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import { NeonOperatorShiftRepository } from '../../Repository/NeonOperatorShiftRepository'

export class OperatorShiftService {
  private repo: NeonOperatorShiftRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonOperatorShiftRepository(db)
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async create(data: { operadorId: number; flotaId: number; fechaInicio: Date; fechaFin: Date }) {
    return await this.repo.create(data)
  }

  async update(id: number, data: { operadorId?: number; flotaId?: number; fechaInicio?: Date; fechaFin?: Date | null }) {
    return await this.repo.update(id, data)
  }
}
