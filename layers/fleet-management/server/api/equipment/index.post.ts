import { db } from '@nuxthub/db'
import { EquipmentService } from '../../services/Equipment/Equipment.service'

export default defineEventHandler(async (event) => {
  const service = new EquipmentService(db)
  const body = await readBody(event)
  const id = await service.registerDevice({
    ...body,
    estadoId: 1, 
    createdAt: new Date(),
    updatedAt: new Date()
  })
  setResponseStatus(event, 201)
  return { id, success: true }
})