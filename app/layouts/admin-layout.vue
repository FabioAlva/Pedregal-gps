<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    {
      label: 'Ajustes del Sistema',
      icon: 'i-lucide-settings-2',
      to: '/settings/company',
      description: 'Configuracion general y datos maestros.'
    }
  ],
  [
    {
      label: 'Seguridad y Accesos',
      icon: 'i-lucide-shield-check',
      children: [
        { label: 'Usuarios', to: '/settings/users', description: 'Gestión de cuentas y directorio.' },
        { label: 'Roles', to: '/settings/roles', description: 'Perfiles con permisos por modulo.' },
        { label: 'Rutas y Permisos', to: '/settings/routes', description: 'Vincular paginas con endpoints.' }
      ]
    }
  ]
]
</script>

<template>
  <MasterERP title="Configuraciones" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>
