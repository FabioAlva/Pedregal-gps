import { db } from '@nuxthub/db'
import { OperatorService } from '../../services/Operator/Operator.service'

export default defineEventHandler(async (event) => {
  const includeInactive = getQuery(event).includeInactive === '1'
  const service = new OperatorService(db)
  return await service.getAll(includeInactive)
})
