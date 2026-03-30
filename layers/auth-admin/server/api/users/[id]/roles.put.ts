// server/api/users/[id]/roles.put.ts
import { db } from '@nuxthub/db'
import { UserService } from '#layers/auth-admin/server/services/User/User.service'

// 1. Instancia fuera del handler
const service = new UserService(db)

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))
  const body = await readBody<{ roleIds?: number[] }>(event)

  // 2. Validación de entrada
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido' })
  }

  try {
    // 3. CAMBIO: Usamos assignRoles (el nombre real en tu UserService)
    // El service ya se encarga de validar que el usuario exista
    await service.assignRoles(userId, body.roleIds ?? [])

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al asignar roles al usuario'
    })
  }
})