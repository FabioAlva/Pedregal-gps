import { auth } from '~~/server/lib/auth'

interface CreateUserBody {
  name?: string
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateUserBody>(event)

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '').trim()

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'name, email y password son requeridos' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'password debe tener al menos 6 caracteres' })
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password
      },
      headers: new Headers()
    })

    setResponseStatus(event, 201)
    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error?.message ?? 'No se pudo crear el usuario'
    })
  }
})
