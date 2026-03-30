export const cacheMaxAge = {
  mapRoute: 30,
  mapStops: 30,
  mapSpeed: 30,
  mapRouteAnalysis: 30,
  mapDistance: 60,
  fleetsAvailable: 60,
  fleetsBasic: 60,
  geofenceList: 120,
  geofenceStaysReport: 60,
  gpsAlerts: 30,
  gpsAlertLogs: 30,
  equipmentList: 60,
  fleetAssignmentsAll: 60,
  fleetAssignmentsActive: 60
} as const

type CacheMaxAgeMap = typeof cacheMaxAge

const getHalfMaxAge = (seconds: number) => Math.max(1, Math.floor(seconds / 2))

export const cacheMaxAgeFromPinia: { [K in keyof CacheMaxAgeMap]: number } =
  Object.fromEntries(
    Object.entries(cacheMaxAge).map(([key, seconds]) => [key, getHalfMaxAge(seconds)])
  ) as { [K in keyof CacheMaxAgeMap]: number }