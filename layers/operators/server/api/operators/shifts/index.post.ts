import { db } from '@nuxthub/db'
import { OperatorShiftService } from '../../../services/OperatorShift/OperatorShift.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.operadorId || !body?.flotaId || !body?.fechaInicio || !body?.fechaFin) {
    throw createError({ statusCode: 400, statusMessage: 'operadorId, flotaId, fechaInicio y fechaFin son requeridos' })
  }

  const service = new OperatorShiftService(db)
  return await service.create({
    operadorId: Number(body.operadorId),
    flotaId: Number(body.flotaId),
    fechaInicio: new Date(body.fechaInicio),
    fechaFin: new Date(body.fechaFin)
  })
})
