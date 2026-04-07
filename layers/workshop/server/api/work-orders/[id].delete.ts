import { db } from '@nuxthub/db'
import { WorkOrderService } from '../../services/WorkOrder/WorkOrder.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const service = new WorkOrderService(db)
  await service.delete(id)

  return { success: true }
})
