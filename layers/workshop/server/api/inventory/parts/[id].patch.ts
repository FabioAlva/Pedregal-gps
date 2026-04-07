import { db } from '@nuxthub/db'
import { InventoryPartService } from '../../../services/InventoryPart/InventoryPart.service'

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

  if ('stockActual' in updates) {
    updates.stockActual = updates.stockActual != null ? Number(updates.stockActual) : 0
  }

  if ('stockMinimo' in updates) {
    updates.stockMinimo = updates.stockMinimo != null ? Number(updates.stockMinimo) : 0
  }

  if ('organizacionId' in updates) {
    updates.organizacionId = updates.organizacionId ? Number(updates.organizacionId) : null
  }

  const service = new InventoryPartService(db)
  await service.update(id, updates)

  return { success: true }
})
