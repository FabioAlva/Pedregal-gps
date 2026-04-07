import { db } from '@nuxthub/db'
import { ExpenseService } from '../../services/Expense/Expense.service'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalido' })
  }

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cuerpo de peticion vacio' })
  }

  const updates: any = { ...body }

  if ('fecha' in updates) {
    updates.fecha = updates.fecha ? new Date(updates.fecha) : null
  }

  if ('monto' in updates) {
    updates.monto = Number(updates.monto)
  }

  if ('operadorId' in updates) {
    updates.operadorId = updates.operadorId ? Number(updates.operadorId) : null
  }

  if ('flotaId' in updates) {
    updates.flotaId = updates.flotaId ? Number(updates.flotaId) : null
  }

  if ('categoriaId' in updates) {
    updates.categoriaId = updates.categoriaId ? Number(updates.categoriaId) : null
  }

  const service = new ExpenseService(db)
  await service.update(id, updates)

  return { success: true }
})
