import { FleetEquipmentService } from "../../../services/FleetEquipment/FleetEquipment.service"
import { db } from '@nuxthub/db'
export default defineEventHandler(async (event) => {
  const idGps = getRouterParam(event, 'idGps')
  if (!idGps) {
    throw createError({ statusCode: 400, message: 'idGps requerido' })
  }

  const service = new FleetEquipmentService(db)
  return await service.getAssignmentsByGpsId(idGps)
})