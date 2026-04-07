<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  // ─── 1. MONITOREO ESTRATÉGICO ────────────────
  [
    { 
      label: 'Dashboard', 
      icon: 'i-lucide-layout-dashboard', 
      to: '/dashboard',
      description: 'Resumen de indicadores clave y estado global de la operación.'
    },
    { 
      label: 'Telemetría en Vivo', 
      icon: 'i-lucide-map-pin', 
      to: '/gps', 
      badge: 'GPS',
      description: 'Seguimiento en tiempo real de la ubicación de todas las unidades.'
    },
  ],

  // ─── 2. GESTIÓN DE ACTIVOS Y CAMPO ──────────────
  [
    {
      label: 'Flota Agrícola',
      icon: 'i-lucide-tractor',
      defaultOpen: true,
      children: [
        { label: 'Maquinaria y Vehículos', to: '/fleet-manager/fleets/list', description: 'Inventario detallado de tractores, camiones y camionetas.' },
        { label: 'Gastos Asociados', to: '/fleet-manager/fleets/expenses', description: 'Historial de costos, reparaciones y facturas por unidad.' },
        { label: 'Implementos', to: '/fleet-manager/fleets/implements', description: 'Gestión de arados, rastras y equipos acoplables.' },
        { label: 'Equipos GPS e IoT', to: '/fleet-manager/equipment', description: 'Control de dispositivos de rastreo y sensores instalados.' },
        { label: 'Estadias por Area', to: '/gps/area-stays', description: 'Reporte de ingresos, salidas y tiempos de permanencia por zona.' },
      ],
    },
      {
      label: 'Capital Humano',
      icon: 'i-lucide-user-check',
      children: [
        { label: 'Padrón de Operadores', to: '/operators/list', description: 'Directorio del personal conductor y técnico.' },
        { label: 'Asignaciones', to: '/operators/shifts', description: 'Asignaciones de operadores a unidades y turnos.' },
      ],
    },
    {
      label: 'Zonas y Campos',
      icon: 'i-lucide-map',
      to: '/gps/geo/zones',
      description: 'Delimitación geográfica de las zonas de cultivo.',
    },
  ],

  // ─── 3. OPERACIONES Y PERSONAL ──────────────────────────────
  [
    {
      label: 'Inspecciones (DVIR)',
      icon: 'i-lucide-clipboard-check',
      children: [
        { label: 'Checklist Diario', to: '/inspections/dvir', description: 'Revisión obligatoria de seguridad antes de cada jornada.' },
        { label: 'Historial de Revisiones', to: '/inspections/history', description: 'Archivo de todas las inspecciones pasadas realizadas.' },
      ],
    },
  
  ],

  // ─── 4. TALLER Y PAPELEO ──────────────────────────────
  [
    {
      label: 'Taller y Reparaciones',
      icon: 'i-lucide-wrench',
      children: [
        { label: 'Reparaciones Activas', to: '/work-orders/open', description: 'Trabajos mecánicos que se están realizando actualmente.' },
        { label: 'Mantenimientos Programados', to: '/pm/schedules', description: 'Servicios preventivos planeados para evitar averías.' },
        { label: 'Almacén de Repuestos', to: '/inventory/parts', description: 'Control de stock de aceites, filtros y piezas críticas.' },
      ],
    },
  ],

  // ─── 5. SEGURIDAD Y COSTOS ENERGÉTICOS ──────────────────────
  [
    {
      label: 'Centro de Alertas',
      icon: 'i-lucide-bell-ring',
      badge: '12',
      children: [
        { label: 'Alertas de Combustible', to: '/alerts/fuel', description: 'Detección de caídas bruscas o posibles robos de diésel.' },
        { label: 'Alertas de Conducción', to: '/alerts/driving', description: 'Excesos de velocidad, frenados bruscos o ralentí excesivo.' },
        { label: 'Alertas Perimetrales', to: '/alerts/geofence', description: 'Notificaciones de entrada o salida de zonas no autorizadas.' },
        { label: 'Botón de Pánico / SOS', to: '/alerts/emergency', description: 'Atención inmediata a emergencias reportadas desde cabina.' },
      ],
    },
  ],

  // ─── 6. CONFIGURACIÓN ───────────────────────────────────────
  [
    { 
      label: 'Ajustes del Sistema', 
      icon: 'i-lucide-settings-2', 
      to: '/settings/company',
      description: 'Configuración de perfiles, permisos y datos de la empresa.'
    },
  ],
]
</script>

<template>
  <MasterERP title="Gestión de Flota" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>