// server/api/users/[id].patch.ts
import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

const service = new UserService(db)

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido' })
  }

  try {
    // 1. Delegamos la limpieza (trim, lowerCase) y validación al Service
    // 2. CAMBIO: Usamos updateProfile (nombre real en tu UserService)
    await service.updateProfile(userId, body.name, body.email)

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al actualizar el perfil'
    })
  }
})