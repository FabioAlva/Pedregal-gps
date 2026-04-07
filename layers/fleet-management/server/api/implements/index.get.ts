import { db } from '@nuxthub/db'
import { ImplementService } from '../../services/Implement/Implement.service'

export default defineEventHandler(async () => {
  const service = new ImplementService(db)
  return await service.getAll()
})
