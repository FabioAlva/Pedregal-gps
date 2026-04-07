import type { MaintenanceLog, NewMaintenanceLog } from '#shared/types/db'

export interface IWorkOrderRepository {
  getAll(): Promise<MaintenanceLog[]>
  create(data: NewMaintenanceLog): Promise<number>
  update(id: number, data: Partial<NewMaintenanceLog>): Promise<void>
  delete(id: number): Promise<void>
}
