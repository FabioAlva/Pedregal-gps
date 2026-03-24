<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import LayoutMasterERP from './MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    { label: 'Seguimiento', type: 'label' },
    { label: 'Mapa en vivo', icon: 'i-lucide-navigation', to: '/gps' },
    { label: 'Reporte GPS', icon: 'i-lucide-align-start-vertical', to: '/gps/report' },
    { label: 'Análisis de trayectos', icon: 'i-lucide-route', to: '/gps/report/analisis-trayectos' },
    { label: 'Ingresos por área', icon: 'i-lucide-map', to: '/gps/area-stays' },
  ],
  [
    { label: 'Gestión', type: 'label' },
    { label: 'Asignación de GPS', icon: 'i-lucide-link-2', to: '/gps/team-fleet' },
  ],
  [
    { label: 'Alertas', type: 'label' },
    { label: 'Historial de alertas', icon: 'i-lucide-history', to: '/gps/alert/historial-alertas' },
    { label: 'Configurar alertas', icon: 'i-lucide-siren', to: '/gps/alert/config-alert' },
  ],
  [
    { label: 'Configuración', type: 'label' },
    { label: 'Roles y permisos', icon: 'i-lucide-shield-check', to: '/configuracion/roles' },
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