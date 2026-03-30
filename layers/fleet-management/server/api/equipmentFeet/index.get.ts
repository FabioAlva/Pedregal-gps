import { db } from '@nuxthub/db'
import { FleetEquipmentService } from '../../services/FleetEquipment/FleetEquipment.service'

export default defineEventHandler(async () => {
  const service = new FleetEquipmentService(db)
  return await service.getAllAssignments()
})