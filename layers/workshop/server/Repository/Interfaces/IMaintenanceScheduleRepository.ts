import type { MaintenanceSchedule, NewMaintenanceSchedule } from '#shared/types/db'

export interface IMaintenanceScheduleRepository {
  getAll(): Promise<MaintenanceSchedule[]>
  create(data: NewMaintenanceSchedule): Promise<number>
  update(id: number, data: Partial<NewMaintenanceSchedule>): Promise<void>
  delete(id: number): Promise<void>
}
