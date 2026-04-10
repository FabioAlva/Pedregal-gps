<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  // ─── 1. MONITOREO ESTRATÉGICO ────────────────
  [
    { 
      label: 'Dashboard', 
      icon: 'i-lucide-layout-grid', 
      to: '/dashboard'
    },
    { 
      label: 'Telemetría en Vivo', 
      icon: 'i-lucide-radar', 
      to: '/gps', 
      badge: 'GPS'
    },
  ],

  // ─── 2. GESTIÓN DE ACTIVOS Y CAMPO ──────────────
  [
    {
      label: 'Flota Agrícola',
      icon: 'i-lucide-tractor',
      defaultOpen: true,
      children: [
        // 'Zap' sugiere energía/maquinaria activa, 'settings' precisión técnica
        { label: 'Maquinaria y Vehículos', to: '/fleet-manager/fleets/list', icon: 'i-lucide-settings' },
        { label: 'Gastos Asociados', to: '/fleet-manager/fleets/expenses', icon: 'i-lucide-banknote' },
        { label: 'Implementos', to: '/fleet-manager/fleets/implements', icon: 'i-lucide-combine' }, // Icono de cosechadora/maquinaria
        { label: 'Equipos GPS e IoT', to: '/fleet-manager/equipment', icon: 'i-lucide-cpu' },
        { label: 'Estadias por Area', to: '/gps/area-stays', icon: 'i-lucide-timer' },
      ],
    },
    {
      label: 'Capital Humano',
      icon: 'i-lucide-contact-2',
      children: [
        { label: 'Padrón de Operadores', to: '/operators/list', icon: 'i-lucide-id-card' },
        { label: 'Asignaciones', to: '/operators/shifts', icon: 'i-lucide-user-cog' },
      ],
    },
    {
      label: 'Zonas y Campos',
      icon: 'i-lucide-sprout',
      defaultOpen: true,
      children: [
        { label: 'Configuración Geográfica', to: '/gps/geo/zones', icon: 'i-lucide-map-pinned' },
        { label: 'Lista de Campos', to: '/gps/geo/fields-list', icon: 'i-lucide-layers-3' },
      ],
    },
  ],

  // ─── 3. OPERACIONES ──────────────────────────────
  [
    {
      label: 'Inspecciones (DVIR)',
      icon: 'i-lucide-clipboard-check',
      children: [
        { label: 'Checklist Diario', to: '/inspections/dvir', icon: 'i-lucide-check-circle-2' },
        { label: 'Historial de Revisiones', to: '/inspections/history', icon: 'i-lucide-file-search' },
      ],
    },
  ],

  // ─── 4. TALLER ──────────────────────────────
  [
    {
      label: 'Taller y Reparaciones',
      icon: 'i-lucide-wrench',
      children: [
        { label: 'Reparaciones Activas', to: '/work-orders/open', icon: 'i-lucide-hammer' },
        { label: 'Mantenimientos Programados', to: '/pm/schedules', icon: 'i-lucide-calendar-range' },
        { label: 'Almacén de Repuestos', to: '/inventory/parts', icon: 'i-lucide-package-search' },
      ],
    },
  ],

  // ─── 5. SEGURIDAD ──────────────────────
  [
    {
      label: 'Centro de Alertas',
      icon: 'i-lucide-shield-alert',
      badge: '12',
      children: [
        { label: 'Alertas de Combustible', to: '/alerts/fuel', icon: 'i-lucide-fuel' },
        { label: 'Alertas de Conducción', to: '/alerts/driving', icon: 'i-lucide-gauge' },
        { label: 'Alertas Perimetrales', to: '/alerts/fence', icon: 'i-lucide-map-off' },
        { label: 'Botón de Pánico / SOS', to: '/alerts/emergency', icon: 'i-lucide-siren' },
      ],
    },
  ],

  // ─── 6. CONFIGURACIÓN ───────────────────────────────────────
  [
    { 
      label: 'Ajustes del Sistema', 
      icon: 'i-lucide-sliders-horizontal', 
      to: '/settings/company',
    },
  ],
]
</script>

<template>
  <MasterERP title="Gestión de Flota" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>