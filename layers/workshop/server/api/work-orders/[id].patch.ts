import { db } from '@nuxthub/db'
import { WorkOrderService } from '../../services/WorkOrder/WorkOrder.service'

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

  if ('flotaId' in updates) {
    updates.flotaId = updates.flotaId ? Number(updates.flotaId) : null
  }

  if ('scheduleId' in updates) {
    updates.scheduleId = updates.scheduleId ? Number(updates.scheduleId) : null
  }

  if ('gastoId' in updates) {
    updates.gastoId = updates.gastoId ? Number(updates.gastoId) : null
  }

  if ('kmAlRealizar' in updates) {
    updates.kmAlRealizar = updates.kmAlRealizar != null ? Number(updates.kmAlRealizar) : null
  }

  if ('horasAlRealizar' in updates) {
    updates.horasAlRealizar = updates.horasAlRealizar != null ? Number(updates.horasAlRealizar) : null
  }

  if ('fecha' in updates) {
    updates.fecha = updates.fecha ? new Date(updates.fecha) : null
  }

  if ('repuestosUsados' in updates) {
    updates.repuestosUsados = Array.isArray(updates.repuestosUsados) ? updates.repuestosUsados : []
  }

  if ('fotosUrl' in updates) {
    updates.fotosUrl = Array.isArray(updates.fotosUrl) ? updates.fotosUrl : []
  }

  const service = new WorkOrderService(db)
  await service.update(id, updates)

  return { success: true }
})
