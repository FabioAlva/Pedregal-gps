import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

export default defineEventHandler(async () => {
  const service = new UserService(db)
  return await service.getAll()
})
