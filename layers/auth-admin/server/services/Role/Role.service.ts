import { NeonRoleRepository } from '#layers/auth-admin/server/Repository/NeonRoleRepository'
import type { DbClient, NewRole } from '~~/shared/types/db'
import type { RoleRoutePermissionInput, RoutePermission } from '#layers/auth-admin/server/Repository/Interfaces/IRoleRepository'
import { NeonUserRepository } from '#layers/auth-admin/server/Repository/NeonUserRepository'

export class RoleService {
 private roleRepo: NeonRoleRepository
  private userRepo: NeonUserRepository

  constructor(db: DbClient) {
    this.roleRepo = new NeonRoleRepository(db)
    this.userRepo = new NeonUserRepository(db)
  }
  async getAll() { return await this.roleRepo.findAll() }

  async getById(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw createError({ statusCode: 404, message: 'Rol no encontrado' })
    return role
  }

  async create(data: NewRole) { return await this.roleRepo.create(data) }

  async update(id: number, data: Partial<NewRole>) {
    await this.getById(id)
    return await this.roleRepo.update(id, data)
  }

  async delete(id: number) { return await this.roleRepo.delete(id) }

  async getPermissions(roleId: number) {
    return await this.roleRepo.getRoleRoutePermissions(roleId)
  }

  async syncPermissions(roleId: number, permissions: RoleRoutePermissionInput[]) {
    await this.getById(roleId)
    return await this.roleRepo.updateRoleRoutePermissions(roleId, permissions)
  }

 async getUserPermissions(userId: string) {
    const userRoles = await this.userRepo.findUserRoles(userId)
    const roleIds = userRoles.map(r => r.rolId)
    
   
    if (roleIds.length === 0) {
      return { routes: {} }
    }

    const allPermissions = await Promise.all(
      roleIds.map(async (id) => {
        const perms = await this.roleRepo.getRoleRoutePermissions(id);
        return perms;
      })
    )

    const routeMap: Record<number, RoutePermission> = {}
    
    allPermissions.flat().forEach(p => {
      const current = routeMap[p.rutaModuloId] || { ver: false, agregar: false, editar: false, eliminar: false }
      
      routeMap[p.rutaModuloId] = {
        ver: current.ver || p.ver,
        agregar: current.agregar || p.agregar,
        editar: current.editar || p.editar,
        eliminar: current.eliminar || p.eliminar
      }
    })

    return { routes: routeMap }
  }
}