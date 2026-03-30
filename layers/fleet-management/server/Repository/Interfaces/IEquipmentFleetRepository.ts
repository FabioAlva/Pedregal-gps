import type { NewFleetEquipment } from '~~/shared/types/db'

export type AssignmentResult = {
  idAsignacion: number
  idGps: string
  nombreGps: string
  imei: string
  placaAuto: string
  fechaAsignacion: Date
  fechaRetiro: Date | null
}

export interface IFleetEquipmentRepository {
  getAssignments(): Promise<AssignmentResult[]>
  getActiveAssignments(): Promise<AssignmentResult[]>
  getActiveAssignmentsByGpsIds(gpsIds: string[]): Promise<AssignmentResult[]>
  getActiveByGpsId(idGps: string): Promise<Pick<AssignmentResult, 'idAsignacion' | 'idGps' | 'placaAuto'> | undefined>
  create(data: NewFleetEquipment): Promise<number>
  update(id: number, data: Partial<NewFleetEquipment>): Promise<void>
}
