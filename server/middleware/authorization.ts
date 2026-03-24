import { requireBackendPermission } from '~~/server/utils/permissions'

const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/_nuxt_icon',
  '/api/module-routes',
  '/api/section-routes'
]

function isApiPath(path: string): boolean {
  return path.startsWith('/api/')
}

function isPublicApi(path: string): boolean {
  return PUBLIC_API_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

export default defineEventHandler(async (event) => {
  const path = String(event.path || '')
  const method = String(event.method || 'GET').toUpperCase()

  if (!isApiPath(path)) return
  if (method === 'OPTIONS') return
  if (isPublicApi(path)) return

  await requireBackendPermission(event)
})
