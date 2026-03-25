// server/api/users/index.post.ts
import { auth } from '~~/server/lib/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Todos los campos son obligatorios' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {

    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: event.headers 
    })

    setResponseStatus(event, 201)
    
    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.message || 'Error al registrar el usuario'
    })
  }
})