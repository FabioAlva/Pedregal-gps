import { db } from '@nuxthub/db'
import { WorkOrderService } from '../../services/WorkOrder/WorkOrder.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const flotaId = Number(body?.flotaId)

  if (!flotaId || Number.isNaN(flotaId)) {
    throw createError({ statusCode: 400, statusMessage: 'flotaId es requerido' })
  }

  const service = new WorkOrderService(db)
  const id = await service.create({
    flotaId,
    scheduleId: body?.scheduleId ? Number(body.scheduleId) : null,
    gastoId: body?.gastoId ? Number(body.gastoId) : null,
    realizadoPor: body?.realizadoPor ?? null,
    kmAlRealizar: body?.kmAlRealizar != null ? Number(body.kmAlRealizar) : null,
    horasAlRealizar: body?.horasAlRealizar != null ? Number(body.horasAlRealizar) : null,
    descripcion: body?.descripcion ?? null,
    repuestosUsados: Array.isArray(body?.repuestosUsados) ? body.repuestosUsados : [],
    fotosUrl: Array.isArray(body?.fotosUrl) ? body.fotosUrl : [],
    fecha: body?.fecha ? new Date(body.fecha) : new Date()
  })

  setResponseStatus(event, 201)
  return { id, success: true }
})
