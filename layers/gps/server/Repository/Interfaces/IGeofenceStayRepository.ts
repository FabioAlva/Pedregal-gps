import type { GeofenceStay, NewGeofenceStay } from '#shared/types/db'

export interface IGeofenceStayRepository {
  findAll(): Promise<GeofenceStay[]>
  findById(id: number): Promise<GeofenceStay | undefined>
  findByFleetEquipmentId(fleetEquipmentId: number): Promise<GeofenceStay[]>
  findByDateRange(params: {
    start: Date
    end: Date
    geofenceId?: number
    fleetEquipmentId?: number
    deviceId?: string
  }): Promise<Array<
    GeofenceStay & {
      geofenceName: string
      deviceId: string
      fleetEquipmentId: number
    }
  >>
  findOpenByFleetEquipmentAndGeofence(fleetEquipmentId: number, geofenceId: number): Promise<GeofenceStay | undefined>
  create(data: NewGeofenceStay): Promise<number>
  update(id: number, data: Partial<NewGeofenceStay>): Promise<void>
  closeOpenStay(params: {
    fleetEquipmentId: number
    geofenceId: number
    exitedAt: Date
    exitLat?: number
    exitLng?: number
  }): Promise<number | undefined>
}
