import { db } from '@nuxthub/db'
import { UserService } from '~~/server/services/User/User.service'

interface UpdateUserBody {
  name?: string
  email?: string
}

export default defineEventHandler(async (event) => {
  const userId = String(getRouterParam(event, 'id'))
  const body = await readBody<UpdateUserBody>(event)

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()

  if (!userId || !name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'id, name y email son requeridos' })
  }

  const service = new UserService(db)
  await service.update(userId, { name, email })

  return { success: true }
})
