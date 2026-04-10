export const cacheNames = {
  fleetsAvailable: 'gps:fleets:available',
  fleetsBasic: 'gps:fleets:basic',
  equipmentList: 'gps:equipment:list',
  fleetAssignmentsAll: 'gps:fleet-equipment:all',
  fleetAssignmentsActive: 'gps:fleet-equipment:active',
  geofenceList: 'gps:geofence:list',
  fieldsList: 'gps:fields:list',
  gpsAlerts: 'gps:alerts:list',
  gpsAlertLogs: 'gps:alert-logs:list',
  geofenceStaysReport: 'gps:geofence-stays:report',
  fieldStaysReport: 'gps:field-stays:report'
} as const

export const cacheKeys = {
  all: () => 'all',
  id: (id: number | string) => String(id),
  fleetsAvailable: (includePlate?: string) => includePlate?.trim() || 'all',
  geofenceStaysReport: (deviceIds: string[], startISO: string, endISO: string) => {
    const normalizedDevices = [...deviceIds].sort().join(',')
    return `${normalizedDevices}:${startISO}:${endISO}`
  },
  fieldStaysReport: (deviceIds: string[], startISO: string, endISO: string) => {
    const normalizedDevices = [...deviceIds].sort().join(',')
    return `${normalizedDevices}:${startISO}:${endISO}`
  }
} as const

const functionGroup = 'nitro/functions'

export const buildFunctionCacheItemKey = (name: string, key: string) => {
  return `${functionGroup}:${name}:${key}.json`
}

export function logCacheMiss(cacheName: string, cacheKey: string, extra?: Record<string, unknown>) {
  console.info('[cache][miss]', {
    cacheName,
    cacheKey,
    ...(extra ?? {})
  })
}

export async function logCacheHitIfPresent(cacheName: string, cacheKey: string, extra?: Record<string, unknown>) {
  const storage = useStorage('cache')
  const itemKey = buildFunctionCacheItemKey(cacheName, cacheKey)
  const entry = await storage.getItem<{ expires?: number } | null>(itemKey)

  if (!entry) return false

  const expires = typeof entry.expires === 'number' ? entry.expires : undefined
  const isValid = typeof expires !== 'number' || expires > Date.now()
  if (!isValid) return false

  console.info('[cache][hit]', {
    cacheName,
    cacheKey,
    ...(extra ?? {})
  })

  return true
}

export async function invalidateFunctionCache(name: string, key: string) {
  /*Acceso a la storage */
  const storage = useStorage('cache')
  
  const itemKey = buildFunctionCacheItemKey(name, key)
  
  await storage.removeItem(itemKey)

  console.info('[cache][invalidate]', { cacheName: name, mode: 'single', cacheKey: key })
}

export async function invalidateFunctionCacheByPrefix(name: string) {
  const storage = useStorage('cache')
  const prefix = `${functionGroup}:${name}:`
  const keys = await storage.getKeys(prefix)

  await Promise.all(keys.map(key => storage.removeItem(key)))

  console.info('[cache][invalidate]', {
    cacheName: name,
    mode: 'prefix',
    prefix,
    removed: keys.length
  })
}
