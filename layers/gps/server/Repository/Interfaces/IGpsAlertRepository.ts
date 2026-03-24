import type { GpsAlert, NewGpsAlert } from '#shared/types/db'

export interface IGpsAlertRepository {
  findAll(): Promise<GpsAlert[] | undefined>
  findById(id: number): Promise<GpsAlert | undefined>
  create(alert: NewGpsAlert): Promise<number>
  update(id: number, data: Partial<NewGpsAlert>): Promise<void>
  updateActive(id: number, activo: boolean): Promise<void>
  delete(id: number): Promise<void>
}