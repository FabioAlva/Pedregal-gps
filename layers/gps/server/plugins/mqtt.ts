
import mqtt from 'mqtt'
import path from 'node:path'
import fs from 'node:fs'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()

  // Mostrar rutas que se intentan leer
  const caPath = path.resolve(process.cwd(), config.ca)
  const certPath = path.resolve(process.cwd(), config.cert)
  const keyPath = path.resolve(process.cwd(), config.key)

  // Validar que las rutas no estén vacías
  if (!config.ca || !config.cert || !config.key) {
    console.error('[MQTT] Alguna ruta de certificado está vacía. Verifica tus variables de entorno.')
    return
  }

  // Validar que los archivos existen
  if (!fs.existsSync(caPath) || !fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('[MQTT] Algún archivo de certificado no existe. Verifica las rutas:')
    if (!fs.existsSync(caPath)) console.error('  No existe:', caPath)
    if (!fs.existsSync(certPath)) console.error('  No existe:', certPath)
    if (!fs.existsSync(keyPath)) console.error('  No existe:', keyPath)
    return
  }

  // Leer archivos
  let ca, cert, key
  try {
    ca = fs.readFileSync(caPath, 'utf-8')
    cert = fs.readFileSync(certPath, 'utf-8')
    key = fs.readFileSync(keyPath, 'utf-8')
  } catch (err) {
    console.error('[MQTT] Error leyendo certificados:', err)
    return
  }

  if (!ca || !cert || !key) {
    console.error('[MQTT] Algún archivo de certificado está vacío.')
    return
  }


  try {
    mqttProvider.client = mqtt.connect(config.hostMqtt as string, { ca, cert, key })

    mqttProvider.client.on('connect', () => {
      mqttProvider.isConnected = true
      if (config.topics?.length) {
        const cleanTopics = config.topics.map(t => t.trim())
        mqttProvider.client!.subscribe(cleanTopics)
      }
    })

    mqttProvider.client.on('error', (err) => {
      console.error('[MQTT] Error de conexión:', err)
    })
  } catch (err) {
    console.error('[MQTT] Excepción al conectar:', err)
    return
  }

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

