// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
   runtimeConfig: {
    mqttBrokerUrl: '',
    mqttUsername: '',
    mqttPassword: '',
    mqttTopic: '',
    hostMqtt: '',
    ca: '',
    cert: '',
    key: '',
    topics: [],
    influxUrl: '',
    influxToken: '',
    influxOrg: '',
    influxBucket: '',
    alerts: {
      emailSender: '',
      emailRecipient: ''
    },
    brevo: {
      apiKey: ''
    },
    public: {
      supabaseUrl: '',
      supabaseKey: ''
    }
  },
  
  hub: {
    blob: true,
    db: {
      dialect: 'postgresql',
      driver: 'neon-http',
      casing: 'snake_case',
      applyMigrationsDuringBuild: true
    }
  },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    ['@nuxthub/core', { db: 'postgresql' }],
    '@nuxtjs/leaflet',
    'nuxt-echarts'
  ],
  vite: {
    optimizeDeps: {
      include: [
        'better-auth/vue',
        'zod',
        '@vue-leaflet/vue-leaflet',
        'leaflet'
      ]
    }, ssr: {
      noExternal: ['@vue-leaflet/vue-leaflet'],
    },
  },
  echarts: {
    renderer: 'svg',
    charts: ['LineChart', 'BarChart', 'PieChart'],
    components: [
      'TitleComponent',
      'GridComponent',
      'TooltipComponent',
      'LegendComponent',
      'DatasetComponent',
      'DataZoomComponent'
    ]
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css']

})