import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'

export default defineEventHandler(async (event) => {
  const service = new EquipmentService(db)
  return await service.getAll()
})