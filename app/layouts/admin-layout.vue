<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    { label: 'Seguridad y Accesos', type: 'label' },
    { label: 'Usuarios', icon: 'i-lucide-users', to: '/auth-admin/users' },
    { label: 'Roles y Permisos', icon: 'i-lucide-shield-check', to: '/auth-admin/roles' },
    { label: 'Relaciones de Rutas', icon: 'i-lucide-route', to: '/auth-admin/routes' },
  ],
  [
    { label: 'Auditoría', type: 'label' },
    { label: 'Logs del Sistema', icon: 'i-lucide-scroll-text', to: '/auth-admin/logs' },
  ]
]
</script>

<template>
  <MasterERP title="Seguridad" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>