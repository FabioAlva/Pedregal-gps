import type { Geofence, NewGeofence } from '#shared/types/db'

export interface IGeofenceRepository {
  findAllActives(): Promise<Geofence[]>
  create(geofence: NewGeofence): Promise<number>
  findById(id: number): Promise<Geofence | undefined>
  update(id: number, data: Partial<NewGeofence>): Promise<void>
  delete(id: number): Promise<void>
}
