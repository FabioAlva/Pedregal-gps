import { db } from '@nuxthub/db'
import { OperatorShiftService } from '../../../services/OperatorShift/OperatorShift.service'

export default defineEventHandler(async () => {
  const service = new OperatorShiftService(db)
  return await service.getAll()
})
