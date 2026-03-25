import { NeonRoleRepository } from '~~/server/Repository/NeonRoleRepository'
import type { DbClient, NewRole } from '~~/shared/types/db'
import type { RoleRoutePermissionInput, RoutePermission } from '~~/server/Repository/Interfaces/IRoleRepository'
import { NeonUserRepository } from '~~/server/Repository/NeonUserRepository'

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

  // Gestión de Permisos 
  async getPermissions(roleId: number) {
    return await this.roleRepo.getRoleRoutePermissions(roleId)
  }

  async syncPermissions(roleId: number, permissions: RoleRoutePermissionInput[]) {
    await this.getById(roleId)
    return await this.roleRepo.updateRoleRoutePermissions(roleId, permissions)
  }

 async getUserPermissions(userId: string) {
    // 1. Ver qué roles tiene el usuario
    const userRoles = await this.userRepo.findUserRoles(userId)
    const roleIds = userRoles.map(r => r.rolId)
    
    console.log(`\n🔍 [SERVICE DEBUG] Usuario: ${userId}`);
    console.log(`🔍 [SERVICE DEBUG] Roles encontrados en DB:`, userRoles.map(r => ({ id: r.rolId, nombre: r.rolNombre })));

    if (roleIds.length === 0) {
      console.log(`⚠️ [SERVICE DEBUG] El usuario no tiene roles asignados.`);
      return { routes: {} }
    }

    // 2. Cargar permisos de cada rol
    const allPermissions = await Promise.all(
      roleIds.map(async (id) => {
        const perms = await this.roleRepo.getRoleRoutePermissions(id);
        // Log específico por rol para ver si alguno "traiciona" el permiso
        console.log(`🔑 [SERVICE DEBUG] Permisos cargados para Rol ID ${id}:`, perms.length, "rutas.");
        return perms;
      })
    )

    const routeMap: Record<number, RoutePermission> = {}
    
    allPermissions.flat().forEach(p => {
      // 3. Log solo si es la ruta del problema (39 = crear roles)
      if (p.rutaModuloId === 39) {
        console.log(`🚨 [SERVICE DEBUG] ¡ALERTA! Encontrado permiso para ruta 39:`, {
          agregar: p.agregar,
          editar: p.editar,
          ver: p.ver,
          eliminar: p.eliminar
        });
      }

      const current = routeMap[p.rutaModuloId] || { ver: false, agregar: false, editar: false, eliminar: false }
      
      routeMap[p.rutaModuloId] = {
        ver: current.ver || p.ver,
        agregar: current.agregar || p.agregar,
        editar: current.editar || p.editar,
        eliminar: current.eliminar || p.eliminar
      }
    })

    console.log(`✅ [SERVICE DEBUG] Mapa final consolidado para ruta 39:`, routeMap[39] || "No definida");
    return { routes: routeMap }
  }
}