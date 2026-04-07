import type { ExpenseCategory, NewExpenseCategory } from '#shared/types/db'

export interface IExpenseCategoryRepository {
  getAll(): Promise<ExpenseCategory[]>
  create(data: NewExpenseCategory): Promise<number>
  update(id: number, data: Partial<NewExpenseCategory>): Promise<void>
  delete(id: number): Promise<void>
}
