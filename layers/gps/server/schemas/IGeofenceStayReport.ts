import type { AssignmentResult } from '../../../fleet-management/server/Repository/Interfaces/IEquipmentFleetRepository'


/**
 * Punto normalizado de telemetria leido desde Influx.
 */

export type TelemetryPoint = {
  deviceId: string
  time: Date
  lat: number
  lng: number
}

export type AssignmentRow = AssignmentResult

type BaseStayReportParams = {
  start: Date
  end: Date
  deviceIds: string[]
}

export type GeofenceStayReportParams = BaseStayReportParams

export type GeofenceOpenStayState = {
  geofenceId: number
  geofenceName: string
  fleetEquipmentId: number
  deviceId: string
  enteredAt: Date
  entryLat: number
  entryLng: number
}

export type GeofenceStayReportItem = {
  id: number
  geofenceId: number
  geofenceName: string
  fleetEquipmentId: number
  deviceId: string
  enteredAt: string
  exitedAt: string | null
  entryLat: number | null
  entryLng: number | null
  exitLat: number | null
  exitLng: number | null
  durationSeconds: number
  durationMinutes: number
}

export type GeofenceStayReportResult = {
  start: Date
  end: Date
  totalSeconds: number
  totalMinutes: number
  totalHours: number
  count: number
  stays: GeofenceStayReportItem[]
}

export type FieldStayReportParams = BaseStayReportParams

export type FieldOpenStayState = {
  fieldId: number
  fieldName: string
  fleetEquipmentId: number
  deviceId: string
  enteredAt: Date
  entryLat: number
  entryLng: number
}

export type FieldStayReportItem = {
  id: number
  fieldId: number
  fieldName: string
  fleetEquipmentId: number
  deviceId: string
  enteredAt: string
  exitedAt: string | null
  entryLat: number | null
  entryLng: number | null
  exitLat: number | null
  exitLng: number | null
  durationSeconds: number
  durationMinutes: number
}

export type FieldStayReportResult = {
  start: Date
  end: Date
  totalSeconds: number
  totalMinutes: number
  totalHours: number
  count: number
  stays: FieldStayReportItem[]
}
