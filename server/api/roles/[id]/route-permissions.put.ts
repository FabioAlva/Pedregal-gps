// server/api/roles/[id]/route-permissions.put.ts
import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'

const service = new RoleService(db)

export default defineEventHandler(async (event) => {
  const roleId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ permissions?: any[] }>(event)

  if (!roleId || isNaN(roleId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID de rol inválido' })
  }

  try {
    await service.syncPermissions(roleId, body.permissions ?? [])
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al sincronizar permisos'
    })
  }
})