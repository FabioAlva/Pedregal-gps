import { db } from '@nuxthub/db'
import { RoleService } from '~~/server/services/Role/Role.service'
import type { RoleRoutePermissionInput } from '~~/server/Repository/Interfaces/IRolePermissionRepository'

interface ReplaceRoleRoutePermissionsBody {
  permissions: RoleRoutePermissionInput[]
}

export default defineEventHandler(async (event) => {
  const roleId = Number(getRouterParam(event, 'id'))
  const body = await readBody<ReplaceRoleRoutePermissionsBody>(event)

  const service = new RoleService(db)
  await service.replaceRoutePermissions(roleId, body.permissions ?? [])

  return { success: true }
})
