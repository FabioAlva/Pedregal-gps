import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'

export default defineEventHandler(async () => {
  const service = new RoleService(db)
  return await service.getAll()
})
