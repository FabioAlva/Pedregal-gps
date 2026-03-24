import type { IBodyMqtt } from '../schemas/IBodyMqtt'

type TelemetryMessage = IBodyMqtt & { deviceId?: string }

const getCoordinates = (reported: TelemetryMessage['state']['reported']) => {
  if (Number.isFinite(reported.lat) && Number.isFinite(reported.lng)) {
    return [Number(reported.lat), Number(reported.lng)] as const
  }

  if (typeof reported.latlng !== 'string') return null

  const [lat, lng] = reported.latlng.split(',').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return [lat, lng] as const
}

export const toGpsTelemetryPayload = (topic: string, payload: Buffer) => {
  const topicDeviceId = topic.split('/')[0]?.trim()
  if (!topicDeviceId || topicDeviceId === 'undefined') return null

  try {
    const message = JSON.parse(payload.toString()) as TelemetryMessage
    const reported = message.state?.reported
    if (!reported) return null

    const coordinates = getCoordinates(reported)
    if (!coordinates) return null

    const [lat, lng] = coordinates
    const payloadDeviceId = typeof message.deviceId === 'string' ? message.deviceId.trim() : ''
    if (payloadDeviceId && payloadDeviceId !== topicDeviceId) return null

    return {
      type: 'device:update' as const,
      deviceId: payloadDeviceId || topicDeviceId,
      ...reported,
      lat,
      lng
    }
  } catch (error) {
    console.error('No se pudo procesar la telemetria MQTT:', error)
    return null
  }
}
