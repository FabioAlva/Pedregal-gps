import { db } from '@nuxthub/db'
import { InspectionService } from '../../services/Inspection/Inspection.service'

export default defineEventHandler(async () => {
  const service = new InspectionService(db)
  return await service.getAll()
})
