import { NeonUserRepository } from '~~/server/Repository/NeonUserRepository'
import { NeonUserRoleRepository } from '~~/server/Repository/NeonUserRoleRepository'
import type { DbClient } from '~~/shared/types/db'

export class UserService {
  private userRepo: NeonUserRepository
  private userRoleRepo: NeonUserRoleRepository

  constructor(db: DbClient) {
    this.userRepo = new NeonUserRepository(db)
    this.userRoleRepo = new NeonUserRoleRepository(db)
  }

  async getAll() {
    return await this.userRepo.findAll()
  }

  async getById(id: string) {
    const user = await this.userRepo.findById(id)
    if (!user) throw new Error(`Usuario con id ${id} no encontrado`)
    return user
  }

  async getUserRoles(userId: string) {
    await this.getById(userId)
    return await this.userRoleRepo.findByUserId(userId)
  }

  async update(userId: string, data: { name: string; email: string }) {
    await this.getById(userId)
    await this.userRepo.update(userId, data)
  }

  async replaceUserRoles(userId: string, roleIds: number[]) {
    await this.getById(userId)
    await this.userRoleRepo.replaceByUser(userId, roleIds)
  }
}
