import { NeonFieldRepository } from '../../Repository/NeonFieldRepository'
import type * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewField } from '~~/shared/types/db'

export class FieldService {
  private repo: NeonFieldRepository

  constructor(db: NeonHttpDatabase<typeof schema>) {
    this.repo = new NeonFieldRepository(db)
  }

  async create(data: NewField) {
    return await this.repo.create(data)
  }

  async getAll() {
    return await this.repo.findAllActives()
  }

  async getById(id: number) {
    return await this.repo.findById(id)
  }

  async update(id: number, data: Partial<NewField>) {
    const normalized: Partial<NewField> = {}

    if ('nombre' in data) normalized.nombre = data.nombre?.trim() || data.nombre
    if ('descripcion' in data) normalized.descripcion = data.descripcion ?? null
    if ('categoria' in data) normalized.categoria = data.categoria
    if ('tipo' in data) normalized.tipo = data.tipo || 'GUIA'
    if ('color' in data) normalized.color = data.color ?? null
    if ('coords' in data) normalized.coords = data.coords ?? []
    if ('areaTotalHa' in data) normalized.areaTotalHa = data.areaTotalHa ?? null
    if ('activo' in data) normalized.activo = Boolean(data.activo)

    if ('parentId' in data) {
      const value = data.parentId as unknown
      normalized.parentId = value === '' || value == null ? null : Number(value)
    }

    return await this.repo.update(id, normalized)
  }

  async delete(id: number) {
    return await this.repo.delete(id)
  }
}
