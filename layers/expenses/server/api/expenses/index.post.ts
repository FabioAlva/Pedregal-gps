import { db } from '@nuxthub/db'
import { ExpenseService } from '../../services/Expense/Expense.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const flotaId = Number(body?.flotaId)
  const categoriaId = Number(body?.categoriaId)
  const monto = Number(body?.monto)

  if (!flotaId || Number.isNaN(flotaId)) {
    throw createError({ statusCode: 400, statusMessage: 'flotaId es requerido' })
  }

  if (!categoriaId || Number.isNaN(categoriaId)) {
    throw createError({ statusCode: 400, statusMessage: 'categoriaId es requerido' })
  }

  if (!monto || Number.isNaN(monto)) {
    throw createError({ statusCode: 400, statusMessage: 'monto es requerido' })
  }

  const operadorId = body?.operadorId ? Number(body.operadorId) : null
  const fecha = body?.fecha ? new Date(body.fecha) : new Date()

  const service = new ExpenseService(db)
  const id = await service.create({
    flotaId,
    categoriaId,
    operadorId,
    monto,
    fecha,
    descripcion: body?.descripcion ?? null,
    metadatos: body?.metadatos ?? {},
    comprobantesUrl: Array.isArray(body?.comprobantesUrl) ? body.comprobantesUrl : []
  })

  setResponseStatus(event, 201)
  return { id, success: true }
})
