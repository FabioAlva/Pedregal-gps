import { db } from '@nuxthub/db'
import { GpsAlertService } from '../../services/GpsAlert/GpsAlert.service'
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<Partial<{ activo: boolean; descripcion: string; limiteValor: number }>>(event)
  const service = new GpsAlertService(db)

  if (body.activo !== undefined) {
    await service.update(Number(id), { activo: body.activo })
    await invalidateFunctionCacheByPrefix(cacheNames.gpsAlerts)
    return { success: true }
  }

  if (body.descripcion !== undefined || body.limiteValor !== undefined) {
    await service.update(Number(id), {
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      ...(body.limiteValor !== undefined ? { limiteValor: body.limiteValor } : {})
    })
    await invalidateFunctionCacheByPrefix(cacheNames.gpsAlerts)
    return { success: true }
  }

  return await service.getById(Number(id))
})