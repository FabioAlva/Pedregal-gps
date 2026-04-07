import { db } from '@nuxthub/db'
import { InspectionTemplateService } from '../../../services/InspectionTemplate/InspectionTemplate.service'

export default defineEventHandler(async () => {
  const service = new InspectionTemplateService(db)
  return await service.getAll()
})
