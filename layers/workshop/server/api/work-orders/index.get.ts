import { db } from '@nuxthub/db'
import { WorkOrderService } from '../../services/WorkOrder/WorkOrder.service'

export default defineEventHandler(async () => {
  const service = new WorkOrderService(db)
  return await service.getAll()
})
