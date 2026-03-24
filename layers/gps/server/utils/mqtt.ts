import type { MqttClient } from 'mqtt'

export const mqttProvider = {
  isConnected: false,
  client: null as MqttClient | null
}
