import { db } from '@nuxthub/db'
import { MaintenanceScheduleService } from '../../../services/MaintenanceSchedule/MaintenanceSchedule.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const flotaId = Number(body?.flotaId)
  const nombre = body?.nombre?.trim()

  if (!flotaId || Number.isNaN(flotaId)) {
    throw createError({ statusCode: 400, statusMessage: 'flotaId es requerido' })
  }

  if (!nombre) {
    throw createError({ statusCode: 400, statusMessage: 'nombre es requerido' })
  }

  const service = new MaintenanceScheduleService(db)
  const id = await service.create({
    flotaId,
    nombre,
    descripcion: body?.descripcion ?? null,
    intervaloKm: body?.intervaloKm != null ? Number(body.intervaloKm) : null,
    intervaloHoras: body?.intervaloHoras != null ? Number(body.intervaloHoras) : null,
    intervaloDias: body?.intervaloDias != null ? Number(body.intervaloDias) : null,
    ultimoKm: body?.ultimoKm != null ? Number(body.ultimoKm) : null,
    ultimasHoras: body?.ultimasHoras != null ? Number(body.ultimasHoras) : null,
    ultimaFecha: body?.ultimaFecha ? new Date(body.ultimaFecha) : null,
    proximaFecha: body?.proximaFecha ? new Date(body.proximaFecha) : null,
    proximoKm: body?.proximoKm != null ? Number(body.proximoKm) : null,
    proximasHoras: body?.proximasHoras != null ? Number(body.proximasHoras) : null,
    activo: body?.activo ?? true
  })

  setResponseStatus(event, 201)
  return { id, success: true }
})
