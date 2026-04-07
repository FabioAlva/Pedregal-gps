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
  gpsAlertLogs,
  equipment,
  operators,
  fleetAssignments,
  expenseCategories,
  fleetExpenses,
  implementsTable,
  inspectionTemplates,
  inspections,
  inspectionIssues,
  inventoryParts,
  maintenanceSchedules,
  maintenanceLogs
} from '@nuxthub/db/schema'

export type EquipmentFleet = typeof fleetEquipment.$inferSelect
export type Equipment = typeof equipment.$inferSelect
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
export type Fleet = typeof fleet.$inferSelect
export type Operator = typeof operators.$inferSelect
export type FleetAssignment = typeof fleetAssignments.$inferSelect
export type ExpenseCategory = typeof expenseCategories.$inferSelect
export type FleetExpense = typeof fleetExpenses.$inferSelect
export type Implement = typeof implementsTable.$inferSelect
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect
export type Inspection = typeof inspections.$inferSelect
export type InspectionIssue = typeof inspectionIssues.$inferSelect
export type InventoryPart = typeof inventoryParts.$inferSelect
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect

export type NewFleetEquipment = typeof fleetEquipment.$inferInsert
export type NewGpsAlertLog = typeof gpsAlertLogs.$inferInsert
export type NewGpsAlert= typeof gpsAlerts.$inferInsert
export type NewGeofenceStay = typeof geofenceStays.$inferInsert
export type NewGeofence = typeof geofences.$inferInsert
export type NewEquipmentStatus = typeof equipmentStatus.$inferInsert
export type NewEquipment = typeof equipment.$inferInsert
export type NewFleet = typeof fleet.$inferInsert
export type NewUser = typeof user.$inferInsert
export type NewRole = typeof roles.$inferInsert
export type NewModuleRoute = typeof moduleRoutes.$inferInsert
export type NewRoleRoutePermission = typeof roleRoutePermissions.$inferInsert
export type NewUserRole = typeof userRoles.$inferInsert
export type NewOperator = typeof operators.$inferInsert
export type NewFleetAssignment = typeof fleetAssignments.$inferInsert
export type NewExpenseCategory = typeof expenseCategories.$inferInsert
export type NewFleetExpense = typeof fleetExpenses.$inferInsert
export type NewImplement = typeof implementsTable.$inferInsert
export type NewInspectionTemplate = typeof inspectionTemplates.$inferInsert
export type NewInspection = typeof inspections.$inferInsert
export type NewInspectionIssue = typeof inspectionIssues.$inferInsert
export type NewInventoryPart = typeof inventoryParts.$inferInsert
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert

export type FuelExpenseMetadata = {
  fuelEntryDate?: string | null
  vendorName?: string | null
  reference?: string | null
  flags?: {
    personal?: boolean
    partialFuelUp?: boolean
    resetUsage?: boolean
  }
  photos?: string[]
  comments?: string | null
}

export type GenericExpenseMetadata = {
  vendorName?: string | null
  reference?: string | null
  details?: string | null
  photos?: string[]
  comments?: string | null
}

export type ExpenseMetadata = FuelExpenseMetadata | GenericExpenseMetadata

// Legacy aliases kept while app naming transitions from section -> module.
export type SectionRoute = ModuleRoute
export type NewSectionRoute = NewModuleRoute
