import { db } from '@nuxthub/db'
import { ExpenseService } from '../../services/Expense/Expense.service'

export default defineEventHandler(async () => {
  const service = new ExpenseService(db)
  return await service.getAll()
})
