import { db } from '@nuxthub/db'
import { FleetService } from '../../services/Fleet/Fleet.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '~~/utils/cache-version'

export default defineEventHandler(async (event) => {
  const service = new FleetService(db)
  const body = await readBody(event)
  try {
    const id = await service.createFleet(body)
    setResponseStatus(event, 201)
    return { id, success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Error al crear la unidad de flota'
    })
  }
})