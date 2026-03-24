import type { DbClient, NewRole } from '~~/shared/types/db'
import type { RoleRoutePermissionInput } from '~~/server/Repository/Interfaces/IRolePermissionRepository'
import { NeonRoleRepository } from '~~/server/Repository/NeonRoleRepository'
import { NeonRolePermissionRepository } from '~~/server/Repository/NeonRolePermissionRepository'

export class RoleService {
  private roleRepo: NeonRoleRepository
  private rolePermissionRepo: NeonRolePermissionRepository

  constructor(db: DbClient) {
    this.roleRepo = new NeonRoleRepository(db)
    this.rolePermissionRepo = new NeonRolePermissionRepository(db)
  }

  async getAll() {
    return await this.roleRepo.findAll()
  }

  async getById(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw new Error(`Rol con id ${id} no encontrado`)
    return role
  }

  async create(data: NewRole) {
    return await this.roleRepo.create(data)
  }

  async update(id: number, data: Partial<NewRole>) {
    await this.getById(id)
    await this.roleRepo.update(id, data)
  }

  async delete(id: number) {
    await this.getById(id)
    await this.roleRepo.delete(id)
  }

  async getRoutePermissions(roleId: number) {
    await this.getById(roleId)
    return await this.rolePermissionRepo.findRoutePermissionsByRoleId(roleId)
  }

  async replaceRoutePermissions(roleId: number, permissions: RoleRoutePermissionInput[]) {
    await this.getById(roleId)
    await this.rolePermissionRepo.replaceRoutePermissionsByRole(roleId, permissions)
  }
}
