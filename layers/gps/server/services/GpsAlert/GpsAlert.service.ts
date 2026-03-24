import type { NewGpsAlert } from '~~/shared/types/db.js'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import { NeonGpsAlertRepository } from '~~/layers/gps/server/Repository/NeonGpsAlertRepository'

export class GpsAlertService {
  private repo: NeonGpsAlertRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonGpsAlertRepository(db)
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async getById(id: number) {
    const alert = await this.repo.findById(id)
    if (!alert) throw new Error(`Alerta con id ${id} no encontrada`)
    return alert
  }

  async create(data: NewGpsAlert) {
    return await this.repo.create(data)
  }

  async update(id: number, data: Partial<NewGpsAlert>) {
    await this.getById(id)
    await this.repo.update(id, data)
  }

  async activate(id: number) {
    await this.getById(id)
    await this.repo.updateActive(id, true)
  }

  async deactivate(id: number) {
    await this.getById(id)
    await this.repo.updateActive(id, false)
  }

  async delete(id: number) {
    await this.getById(id)
    await this.repo.delete(id)
  }
}