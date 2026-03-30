import { db } from '@nuxthub/db'
import { FleetService } from '../../services/Fleet/Fleet.service'

export default defineEventHandler(async (event) => {
  const { includePlate } = getQuery(event)
  const safeIncludePlate = typeof includePlate === 'string' ? includePlate : undefined
  const service = new FleetService(db)
  return await service.getAvailableFleets(safeIncludePlate)
})