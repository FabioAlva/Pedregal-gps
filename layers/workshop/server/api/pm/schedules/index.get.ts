import { db } from '@nuxthub/db'
import { MaintenanceScheduleService } from '../../../services/MaintenanceSchedule/MaintenanceSchedule.service'

export default defineEventHandler(async () => {
  const service = new MaintenanceScheduleService(db)
  return await service.getAll()
})
