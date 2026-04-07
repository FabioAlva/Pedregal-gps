import { db } from '@nuxthub/db'
import { MaintenanceScheduleService } from '../../../services/MaintenanceSchedule/MaintenanceSchedule.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const service = new MaintenanceScheduleService(db)
  await service.delete(id)

  return { success: true }
})
