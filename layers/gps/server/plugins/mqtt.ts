import mqtt from 'mqtt'
import path from 'node:path'
import fs from 'node:fs'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()

  const ca = fs.readFileSync(path.resolve(process.cwd(), config.ca), 'utf-8')
  const cert = fs.readFileSync(path.resolve(process.cwd(), config.cert), 'utf-8')
  const key = fs.readFileSync(path.resolve(process.cwd(), config.key), 'utf-8')

  if (!ca || !cert || !key) {
    console.error('Certificados no encontrados en server/assets/certs/')
    return
  }

  mqttProvider.client = mqtt.connect(config.hostMqtt as string, { ca, cert, key })

  mqttProvider.client.on('connect', () => {
    mqttProvider.isConnected = true
    if (config.topics?.length) {
      const cleanTopics = config.topics.map(t => t.trim())
      mqttProvider.client!.subscribe(cleanTopics)
    }
  })

  nitroApp.hooks.hook('close', async () => {
    try {
      if (mqttProvider.client && mqttProvider.isConnected) {
        await mqttProvider.client.endAsync()
        mqttProvider.isConnected = false
        mqttProvider.client = null
        console.log('MQTT client closed successfully')
      } else {
        console.log('MQTT client was already closed or not connected')
      }
    } catch (err) {
      console.error('Error closing MQTT client:', err)
    }
  })
})
