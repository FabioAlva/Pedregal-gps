import type { H3Event } from 'h3'
import { mqttProvider } from './mqtt'
import { toGpsTelemetryPayload } from './gps-telemetry'

const getTopics = () => {
  const config = useRuntimeConfig()
  const runtimeTopics = Array.isArray(config.topics)
    ? config.topics.filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
    : []

  if (runtimeTopics.length > 0) return runtimeTopics
  if (typeof config.mqttTopic === 'string' && config.mqttTopic.trim().length > 0) return [config.mqttTopic]

  return ['#']
}

export function createGpsRealtimeEventStream(event: H3Event, filters?: { deviceId?: string }) {
  if (!mqttProvider.client || !mqttProvider.isConnected) {
    throw createError({
      statusCode: 503,
      statusMessage: 'La conexión MQTT no esta disponible'
    })
  }

  const eventStream = createEventStream(event)

  for (const topic of getTopics()) {
    mqttProvider.client.subscribe(topic, (error) => {
      if (error) {
        console.error(`No se pudo suscribir al tópico MQTT ${topic}:`, error)
      }
    })
  }

  const messageHandler = (topic: string, payload: Buffer) => {
    const telemetryPayload = toGpsTelemetryPayload(topic, payload)
    if (!telemetryPayload) return
    if (filters?.deviceId && telemetryPayload.deviceId !== filters.deviceId) return

    eventStream.push({
      data: JSON.stringify(telemetryPayload)
    })
  }

  mqttProvider.client.on('message', messageHandler)

  eventStream.onClosed(() => {
    mqttProvider.client?.off('message', messageHandler)
  })

  return eventStream.send()
}
