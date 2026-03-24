import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))
  const service = new UserService(db)
  return await service.getUserRoles(userId)
})
