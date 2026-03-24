import type { NewGpsAlertLog } from '~~/shared/types/db.js'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import { NeonGpsAlertLogRepository } from '~~/layers/gps/server/Repository/NeonGpsAlertLogRepository'

export class GpsAlertLogService {
  private repo: NeonGpsAlertLogRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonGpsAlertLogRepository(db)
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async getById(id: number) {
    const log = await this.repo.findById(id)
    if (!log) throw new Error(`Log con id ${id} no encontrado`)
    return log
  }

  async getByAlertId(alertaId: number) {
    return await this.repo.findByAlertId(alertaId)
  }

  async getByEquipmentId(fleetEquipmentId: number) {
    return await this.repo.findByEquipmentId(fleetEquipmentId)
  }

  async register(data: NewGpsAlertLog) {
    if (data.valorRegistrado < 0) {
      throw new Error('El valor registrado no puede ser negativo')
    }

    if (data.limiteVigente < 0) {
      throw new Error('El límite vigente no puede ser negativo')
    }

    return await this.repo.create(data)
  }
}