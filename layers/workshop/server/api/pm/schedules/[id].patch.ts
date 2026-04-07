import { db } from '@nuxthub/db'
import { MaintenanceScheduleService } from '../../../services/MaintenanceSchedule/MaintenanceSchedule.service'

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

  if ('intervaloKm' in updates) {
    updates.intervaloKm = updates.intervaloKm != null ? Number(updates.intervaloKm) : null
  }

  if ('intervaloHoras' in updates) {
    updates.intervaloHoras = updates.intervaloHoras != null ? Number(updates.intervaloHoras) : null
  }

  if ('intervaloDias' in updates) {
    updates.intervaloDias = updates.intervaloDias != null ? Number(updates.intervaloDias) : null
  }

  if ('ultimoKm' in updates) {
    updates.ultimoKm = updates.ultimoKm != null ? Number(updates.ultimoKm) : null
  }

  if ('ultimasHoras' in updates) {
    updates.ultimasHoras = updates.ultimasHoras != null ? Number(updates.ultimasHoras) : null
  }

  if ('proximoKm' in updates) {
    updates.proximoKm = updates.proximoKm != null ? Number(updates.proximoKm) : null
  }

  if ('proximasHoras' in updates) {
    updates.proximasHoras = updates.proximasHoras != null ? Number(updates.proximasHoras) : null
  }

  if ('ultimaFecha' in updates) {
    updates.ultimaFecha = updates.ultimaFecha ? new Date(updates.ultimaFecha) : null
  }

  if ('proximaFecha' in updates) {
    updates.proximaFecha = updates.proximaFecha ? new Date(updates.proximaFecha) : null
  }

  const service = new MaintenanceScheduleService(db)
  await service.update(id, updates)

  return { success: true }
})
