import { requireBackendPermission } from '#layers/auth-admin/server/utils/betterauth-permissions'

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/_nuxt_icon',
  '/api/module-routes',
]

function isApiPath(path: string): boolean {
  return path.startsWith('/api/')
}

function isPublicApi(path: string): boolean {
   const pathOnly = path.split('?')[0] ?? ''
  return PUBLIC_API_PREFIXES.some(prefix => 
    pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  )
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  const method = event.method.toUpperCase()

  if (!isApiPath(path)) return
  if (method === 'OPTIONS') return
  if (isPublicApi(path)) return

  await requireBackendPermission(event)
})