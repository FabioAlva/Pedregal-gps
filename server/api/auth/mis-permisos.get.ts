import { getMyPermissions } from '~~/server/utils/betterauth-permissions'

export default defineEventHandler(async (event) => {
  console.info('[api/auth/mis-permisos] start', {
    path: event.path,
    method: event.method
  })

  try {
    const permissions = await getMyPermissions(event)
    console.info('[api/auth/mis-permisos] success', {
      routes: Object.keys(permissions?.routes ?? {})
    })
    return permissions
  } catch (error: any) {
    console.error('[api/auth/mis-permisos] error', {
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      message: error?.message
    })
    throw error
  }
})
