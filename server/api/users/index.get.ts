// server/api/users/index.get.ts
import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

// 1. Instancia única fuera del handler para optimizar el worker de Nitro
const service = new UserService(db)

export default defineEventHandler(async () => {
  try {
    /* 2. Obtiene el listado completo de usuarios registrados */
    return await service.getAll()
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: 'Error al obtener el listado de usuarios'
    })
  }
})