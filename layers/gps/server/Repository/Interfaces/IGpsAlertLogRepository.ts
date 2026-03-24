import type { GpsAlertLog, NewGpsAlertLog } from '#shared/types/db'

export interface IGpsAlertLogRepository {
  findAll(): Promise<GpsAlertLog[] | undefined>
  findById(id: number): Promise<GpsAlertLog | undefined>
  findByAlertId(alertaId: number): Promise<GpsAlertLog[] | undefined>
  findByEquipmentId(fleetEquipmentId: number): Promise<GpsAlertLog[] | undefined>
  create(log: NewGpsAlertLog): Promise<number>
}