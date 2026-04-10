
import mqtt from 'mqtt'
import path from 'node:path'
import fs from 'node:fs'
import { db } from '@nuxthub/db'
import { EquipmentService } from '#layers/fleet-management/server/services/Equipment/Equipment.service'

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
      ;(async () => {
        try {
          const service = new EquipmentService(db)
          const equipments = await service.getAll()
          const topics = equipments
            .map(item => item?.especificaciones?.topic)
            .filter((topic: string | null | undefined) => typeof topic === 'string' && topic.trim().length > 0)
            .map((topic: string) => topic.trim())

          const fallbackTopics = Array.isArray(config.topics) ? config.topics.map(t => t.trim()) : []
          const uniqueTopics = Array.from(new Set([...topics, ...fallbackTopics]))

          if (uniqueTopics.length) {
            mqttProvider.client!.subscribe(uniqueTopics)
          } else {
            console.warn('[MQTT] No se encontraron topics para suscribir.')
          }
        } catch (err) {
          console.error('[MQTT] Error obteniendo topics desde equipment:', err)
        }
      })()
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

