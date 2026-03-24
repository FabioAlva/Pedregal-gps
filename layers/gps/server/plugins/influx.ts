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
      await client.close()
    })
  } catch (error) {
    console.error(`InfluxDB Error: ${error}`)
  }
})
