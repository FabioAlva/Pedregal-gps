import { InfluxDBClient } from '@influxdata/influxdb3-client'
import { influxProvider } from '../utils/influx'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()

  if (!config.influxUrl || !config.influxToken) {
    console.error('❌ InfluxDB: Faltan variables de entorno')
    return
  }

  try {
    const client = new InfluxDBClient({
      host: config.influxUrl,
      token: config.influxToken,
      database: config.influxBucket
    })

    influxProvider.client = client

    nitroApp.hooks.hook('close', async () => {
      try {
        await client.close()
      } catch (closeErr) {
        console.error('Error cerrando conexión InfluxDB:', closeErr)
      }
    })
  } catch (error) {
    console.error('[InfluxDB] Error al inicializar cliente:', error)
    influxProvider.client = null
    return
  }
})
