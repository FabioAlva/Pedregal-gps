<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import LayoutMasterERP from './MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    { label: 'Seguimiento', type: 'label' },
    { label: 'Mapa en vivo', icon: 'i-lucide-navigation', to: '/gps' },
    { label: 'Reporte GPS', icon: 'i-lucide-align-start-vertical', to: '/gps/report' },
    { label: 'Ingresos por área', icon: 'i-lucide-map', to: '/gps/area-stays' },
  ],
  
  [
    { label: 'Alertas', type: 'label' },
    { label: 'Historial de alertas', icon: 'i-lucide-history', to: '/gps/alert/historial-alertas' },
    { label: 'Configurar alertas', icon: 'i-lucide-siren', to: '/gps/alert/config-alert' },
  ],
]
</script>

<template>
  <LayoutMasterERP
    title="Monitoreo"
    :nav-items="navigationNav"
  >
    <slot />
  </LayoutMasterERP>
</template>