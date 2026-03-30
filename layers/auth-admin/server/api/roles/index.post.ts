// server/api/roles/index.post.ts
import { db } from '@nuxthub/db'
import { RoleService } from '#layers/auth-admin/server/services/Role/Role.service'
import type { NewRole } from '~~/shared/types/db'

const service = new RoleService(db)

export default defineEventHandler(async (event) => {
  const body = await readBody<NewRole>(event)

  if (!body.nombre || body.nombre.trim() === '') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'El nombre del rol es obligatorio' 
    })
  }

  try {
    const id = await service.create(body)
    setResponseStatus(event, 201)
    return { id }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Error al crear el nuevo rol'
    })
  }
})