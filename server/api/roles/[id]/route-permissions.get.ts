import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'

export default defineEventHandler(async (event) => {
  const roleId = Number(getRouterParam(event, 'id'))
  const service = new RoleService(db)
  return await service.getRoutePermissions(roleId)
})
