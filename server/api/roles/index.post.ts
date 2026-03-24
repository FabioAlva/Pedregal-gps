import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'
import type { NewRole } from '~~/shared/types/db'

export default defineEventHandler(async (event) => {
  const body: NewRole = await readBody(event)
  const service = new RoleService(db)
  const id = await service.create(body)
  setResponseStatus(event, 201)
  return { id }
})
