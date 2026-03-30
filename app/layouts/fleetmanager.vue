<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    { label: 'Operaciones', type: 'label' },
    { label: 'Gestión de Flotas', icon: 'i-ph-truck-bold', to: '/fleet-manager/fleets' },
    { label: 'Gestión de Equipos', icon: 'i-ph-cpu-bold', to: '/fleet-manager/equipment' },
  ],
 [
    { label: 'Gestión', type: 'label' },
    { label: 'Asignación de GPS', icon: 'i-lucide-link-2', to: '/fleet-manager/team-fleet' },
  ],
]
</script>

<template>
  <MasterERP title="Fleet Manager" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>