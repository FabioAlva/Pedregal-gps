// server/api/roles/[id]/route-permissions.get.ts
import { db } from '@nuxthub/db'
import { RoleService } from '#layers/auth-admin/server/services/Role/Role.service'

const service = new RoleService(db)

export default defineEventHandler(async (event) => {
  const roleId = Number(getRouterParam(event, 'id'))
  if (!roleId || isNaN(roleId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de rol inválido' })
  }
  try {
    return await service.getPermissions(roleId)
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener los permisos del rol'
    })
  }
})