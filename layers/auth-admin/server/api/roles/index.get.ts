import { db } from '@nuxthub/db'
import { RoleService } from '#layers/auth-admin/server/services/Role/Role.service'

export default defineEventHandler(async () => {
  const service = new RoleService(db)
  return await service.getAll()
})
