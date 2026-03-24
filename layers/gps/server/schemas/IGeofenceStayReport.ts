import type { AssignmentResult } from '../Repository/Interfaces/IEquipmentFleetRepository'


/**
 * Punto normalizado de telemetria leido desde Influx.
 */

export type TelemetryPoint = {
  deviceId: string
  time: Date
  lat: number
  lng: number
}

export type GeofenceStayReportParams = {
  start: Date
  end: Date
  deviceIds: string[]
}

export type AssignmentRow = AssignmentResult

export type OpenStayState = {
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