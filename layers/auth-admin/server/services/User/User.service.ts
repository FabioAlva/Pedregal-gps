import { NeonUserRepository } from '#layers/auth-admin/server/Repository/NeonUserRepository'
import type { DbClient } from '~~/shared/types/db'

export class UserService {
  private repo: NeonUserRepository

  constructor(db: DbClient) {
    this.repo = new NeonUserRepository(db)
  }

  async getAll() { return await this.repo.findAll() }

  async getById(id: string) {
    const user = await this.repo.findById(id)
    if (!user) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    return user
  }

async updateProfile(id: string, name?: string, email?: string) {
  const cleanName = String(name ?? '').trim()
  const cleanEmail = String(email ?? '').trim().toLowerCase()

  if (!cleanName || !cleanEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y email son requeridos' })
  }

  await this.getById(id) 
  return await this.repo.update(id, { name: cleanName, email: cleanEmail })
}

  // Gestión de Roles del Usuario
  async getUserRoles(userId: string) {
    return await this.repo.findUserRoles(userId)
  }


  
  async assignRoles(userId: string, roleIds: number[]) {
    await this.getById(userId)
    return await this.repo.setUserRoles(userId, roleIds)
  }
}