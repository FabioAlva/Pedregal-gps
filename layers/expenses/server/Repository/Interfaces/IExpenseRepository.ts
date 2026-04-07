import type { FleetExpense, NewFleetExpense } from '#shared/types/db'

export interface IExpenseRepository {
  getAll(): Promise<FleetExpense[]>
  create(data: NewFleetExpense): Promise<number>
  update(id: number, data: Partial<NewFleetExpense>): Promise<void>
  delete(id: number): Promise<void>
}
