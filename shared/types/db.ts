import type {
  user,
  roles,
  moduleRoutes,
  roleRoutePermissions,
  userRoles,
  equipmentStatus,
  equipmentType,
  fleet,
  geofences,
  geofenceStays,
  fleetEquipment,
  gpsAlerts,
  gpsAlertLogs
} from '@nuxthub/db/schema'

export type DbClient = typeof import('@nuxthub/db').db

export type GpsAlertLog = typeof gpsAlertLogs.$inferSelect
export type GpsAlert = typeof gpsAlerts.$inferSelect
export type FleetEquipment = typeof fleetEquipment.$inferSelect
export type Geofence = typeof geofences.$inferSelect
export type GeofenceStay = typeof geofenceStays.$inferSelect
export type User = typeof user.$inferSelect
export type Role = typeof roles.$inferSelect
export type ModuleRoute = typeof moduleRoutes.$inferSelect
export type RoleRoutePermission = typeof roleRoutePermissions.$inferSelect
export type UserRole = typeof userRoles.$inferSelect

export type NewGpsAlertLog = typeof gpsAlertLogs.$inferInsert
export type NewGpsAlert= typeof gpsAlerts.$inferInsert
export type NewGeofenceStay = typeof geofenceStays.$inferInsert
export type NewGeofence = typeof geofences.$inferInsert
export type NewEquipmentStatus = typeof equipmentStatus.$inferInsert
export type NewEquipmentType = typeof equipmentType.$inferInsert
export type NewFleet = typeof fleet.$inferInsert
export type NewUser = typeof user.$inferInsert
export type NewRole = typeof roles.$inferInsert
export type NewModuleRoute = typeof moduleRoutes.$inferInsert
export type NewRoleRoutePermission = typeof roleRoutePermissions.$inferInsert
export type NewUserRole = typeof userRoles.$inferInsert

// Legacy aliases kept while app naming transitions from section -> module.
export type SectionRoute = ModuleRoute
export type NewSectionRoute = NewModuleRoute
