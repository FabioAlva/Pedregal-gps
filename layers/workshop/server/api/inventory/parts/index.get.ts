import { db } from '@nuxthub/db'
import { InventoryPartService } from '../../../services/InventoryPart/InventoryPart.service'

export default defineEventHandler(async () => {
  const service = new InventoryPartService(db)
  return await service.getAll()
})
