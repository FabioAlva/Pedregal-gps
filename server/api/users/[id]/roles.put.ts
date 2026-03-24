import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

interface ReplaceUserRolesBody {
  roleIds: number[]
}

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))
  const body = await readBody<ReplaceUserRolesBody>(event)

  const service = new UserService(db)
  await service.replaceUserRoles(userId, body.roleIds ?? [])

  return { success: true }
})
