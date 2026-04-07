import { db } from '@nuxthub/db'
import { InventoryPartService } from '../../../services/InventoryPart/InventoryPart.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const nombre = body?.nombre?.trim()

  if (!nombre) {
    throw createError({ statusCode: 400, statusMessage: 'nombre es requerido' })
  }

  const service = new InventoryPartService(db)
  const id = await service.create({
    nombre,
    sku: body?.sku ?? null,
    unidad: body?.unidad ?? 'UND',
    stockActual: body?.stockActual != null ? Number(body.stockActual) : 0,
    stockMinimo: body?.stockMinimo != null ? Number(body.stockMinimo) : 0,
    ubicacion: body?.ubicacion ?? null,
    descripcion: body?.descripcion ?? null,
    activo: body?.activo ?? true,
    organizacionId: body?.organizacionId ? Number(body.organizacionId) : null
  })

  setResponseStatus(event, 201)
  return { id, success: true }
})
