import { db } from '@nuxthub/db'
import { OperatorService } from '../../services/Operator/Operator.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const service = new OperatorService(db)
  return await service.getById(id)
})
