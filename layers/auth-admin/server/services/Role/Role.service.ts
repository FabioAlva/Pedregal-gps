import { NeonRoleRepository } from '#layers/auth-admin/server/Repository/NeonRoleRepository'
import type { DbClient, NewRole } from '~~/shared/types/db'
import type { RoleRoutePermissionInput, RoutePermission } from '#layers/auth-admin/server/Repository/Interfaces/IRoleRepository'
import { NeonUserRepository } from '#layers/auth-admin/server/Repository/NeonUserRepository'
import { frontendBackendRouteLinks } from '~~/server/db/schema'
import { inArray } from 'drizzle-orm'

export class RoleService {
 private roleRepo: NeonRoleRepository
  private userRepo: NeonUserRepository
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
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
    const permissionMap = new Map<number, RoleRoutePermissionInput>()

    for (const permission of permissions) {
      permissionMap.set(permission.rutaModuloId, {
        rutaModuloId: permission.rutaModuloId,
        ver: Boolean(permission.ver),
        agregar: Boolean(permission.agregar),
        editar: Boolean(permission.editar),
        eliminar: Boolean(permission.eliminar)
      })
    }

    const frontendIds = permissions
      .filter(p => p.ver || p.agregar || p.editar || p.eliminar)
      .map(p => p.rutaModuloId)

    if (frontendIds.length > 0) {
      const links = await this.db
        .select({
          frontendId: frontendBackendRouteLinks.frontendRouteId,
          backendId: frontendBackendRouteLinks.backendRouteId
        })
        .from(frontendBackendRouteLinks)
        .where(inArray(frontendBackendRouteLinks.frontendRouteId, frontendIds))

      for (const link of links) {
        const frontendPermission = permissionMap.get(link.frontendId)
        if (!frontendPermission) continue

        const current = permissionMap.get(link.backendId) || {
          rutaModuloId: link.backendId,
          ver: false,
          agregar: false,
          editar: false,
          eliminar: false
        }

        permissionMap.set(link.backendId, {
          rutaModuloId: link.backendId,
          ver: current.ver || frontendPermission.ver,
          agregar: current.agregar || frontendPermission.agregar,
          editar: current.editar || frontendPermission.editar,
          eliminar: current.eliminar || frontendPermission.eliminar
        })
      }
    }

    return await this.roleRepo.updateRoleRoutePermissions(
      roleId,
      Array.from(permissionMap.values())
    )
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