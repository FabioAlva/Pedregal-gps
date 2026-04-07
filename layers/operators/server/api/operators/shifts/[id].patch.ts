import { db } from '@nuxthub/db'
import { OperatorShiftService } from '../../../services/OperatorShift/OperatorShift.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const service = new OperatorShiftService(db)
  return await service.update(id, {
    operadorId: body.operadorId ? Number(body.operadorId) : undefined,
    flotaId: body.flotaId ? Number(body.flotaId) : undefined,
    fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : undefined,
    fechaFin: body.fechaFin ? new Date(body.fechaFin) : undefined
  })
})
