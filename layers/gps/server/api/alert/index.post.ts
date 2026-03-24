import { SpeedAlertInfo } from "../../schemas/ISpeedAlertInfo"
import { AlertService } from "../../services/Alert/Alert.service"
import { cacheNames, invalidateFunctionCacheByPrefix } from '../../utils/cache-version'

export default defineEventHandler(async (event) => {
 /*Se captura el body de la solicitud */
  const body = await readBody(event)
  const { deviceId, speed, lat, lng } = body
  /*Se validan los datos recibidos */
  if (!deviceId || speed === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de GPS incompletos' })
  }
  /*Se instancia el servicio de alertas */
  const service = new AlertService(db)
  /*Se llama al servicio para verificar y registrar la velocidad */
  const alertResult = await service.checkAndLogSpeed(deviceId, speed, lat, lng)

if (alertResult.status === 201 && alertResult.data) {
 /*Si se generó una alerta, se invalida la cache de alertas y se envía un correo */
  await invalidateFunctionCacheByPrefix(cacheNames.gpsAlertLogs)
  await sendAlertEmail(alertResult.data as SpeedAlertInfo)
  return { success: true, alerted: true }
}

return { success: true, alerted: false }
})