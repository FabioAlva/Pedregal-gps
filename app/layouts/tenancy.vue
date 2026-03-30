<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import MasterERP from '~/layouts/MasterERP.vue'

const navigationNav: NavigationMenuItem[][] = [
  [
    { label: 'Organizaciones', type: 'label' },
    { label: 'Empresas Clientes', icon: 'i-lucide-building-2', to: '/admin/organizations' },
    { label: 'Suscripciones', icon: 'i-lucide-credit-card', to: '/admin/billing' },
  ]
]
</script>

<template>
  <MasterERP title="Portal SaaS" :nav-items="navigationNav">
    <slot />
  </MasterERP>
</template>