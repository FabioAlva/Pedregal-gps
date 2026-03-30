// server/api/users/[id]/roles.get.ts
import { db } from '@nuxthub/db'
import { UserService } from '#layers/auth-admin/server/services/User/User.service'

// 1. Instancia única fuera del handler
const service = new UserService(db)

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))

  // 2. Validación básica de entrada
  if (!userId || userId.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario inválido' })
  }

  try {
    // 3. Delegamos al servicio (que ya hace el JOIN en el Repo)
    return await service.getUserRoles(userId)
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al obtener roles del usuario'
    })
  }
})