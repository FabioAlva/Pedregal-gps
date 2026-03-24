import type { DbClient } from '~~/shared/types/db'
import { NeonModuleRouteRepository } from '~~/server/Repository/NeonModuleRouteRepository'
import type { ModuleRouteInput } from '~~/server/Repository/Interfaces/IModuleRouteRepository'

export class ModuleRouteService {
  private repo: NeonModuleRouteRepository

  constructor(db: DbClient) {
    this.repo = new NeonModuleRouteRepository(db)
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async getById(id: number) {
    const row = await this.repo.findById(id)
    if (!row) throw new Error(`Ruta con id ${id} no encontrada`)
    return row
  }

  async create(data: ModuleRouteInput) {
    return await this.repo.create(data)
  }

  async update(id: number, data: ModuleRouteInput) {
    await this.getById(id)
    await this.repo.update(id, data)
  }

  async delete(id: number) {
    await this.getById(id)
    await this.repo.delete(id)
  }
}
