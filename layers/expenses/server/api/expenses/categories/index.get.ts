import { db } from '@nuxthub/db'
import { ExpenseCategoryService } from '../../../services/ExpenseCategory/ExpenseCategory.service'

export default defineEventHandler(async () => {
  const service = new ExpenseCategoryService(db)
  return await service.getAll()
})
