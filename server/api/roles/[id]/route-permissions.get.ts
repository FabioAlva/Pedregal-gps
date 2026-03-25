// server/api/roles/[id]/route-permissions.get.ts
import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'

// 1. Instancia fuera para reutilizar el worker
const service = new RoleService(db)

export default defineEventHandler(async (event) => {
  const roleId = Number(getRouterParam(event, 'id'))

  // 2. Validación defensiva
  if (!roleId || isNaN(roleId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de rol inválido' })
  }

  try {
    // 3. El service ya sabe qué devolver
    return await service.getPermissions(roleId)
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener los permisos del rol'
    })
  }
})