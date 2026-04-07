import { db } from '@nuxthub/db'
import { InspectionService } from '../../services/Inspection/Inspection.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const flotaId = Number(body?.flotaId)

  if (!flotaId || Number.isNaN(flotaId)) {
    throw createError({ statusCode: 400, statusMessage: 'flotaId es requerido' })
  }

  const operadorId = body?.operadorId ? Number(body.operadorId) : null
  const plantillaId = body?.plantillaId ? Number(body.plantillaId) : null

  if (!body?.respuestas || typeof body.respuestas !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'respuestas es requerido' })
  }

  const service = new InspectionService(db)
  const id = await service.create({
    flotaId,
    operadorId,
    plantillaId,
    esquemaSnapshot: body.esquemaSnapshot ?? null,
    respuestas: body.respuestas,
    estado: body.estado ?? 'APROBADO',
    tipo: body.tipo ?? 'PRE_USO',
    firmaUrl: body.firmaUrl ?? null,
    observaciones: body.observaciones ?? null
  }, Array.isArray(body.issues) ? body.issues : [])

  setResponseStatus(event, 201)
  return { id, success: true }
})
