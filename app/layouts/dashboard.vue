<script setup lang="ts">
import { useAuthSession } from '~/composables/useAuthSession'

const { user, logout, isAuthenticated } = await useAuthSession()
const userName = computed(() => user?.value?.name || user?.value?.email || 'Usuario')
const userAvatar = computed(() => user?.value?.image || undefined)
const dropdownItems = computed(() => [
  [{ label: userName.value }],
  [{ label: 'Mi perfil', icon: 'i-lucide-user', to: '/profile' }],
  [{ label: 'Cerrar sesión', icon: 'i-lucide-log-out', onSelect: () => logout() }]
])
</script>

<template>
  <UMain class="min-h-screen bg-neutral-50">
    <header class="w-full border-b border-default bg-white/70 p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo2.png" alt="logo" class="w-8 h-8 object-contain" />
          <div class="hidden sm:block">
            <p class="text-xs font-semibold uppercase text-primary">TGI</p>
            <h1 class="text-lg font-black text-highlighted">Dashboard</h1>
          </div>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <UColorModeButton />
        <UDropdownMenu :items="dropdownItems">
          <UAvatar :src="userAvatar" alt="avatar" size="sm" />
        </UDropdownMenu>
      </div>
    </header>

    <main class="p-6 max-w-7xl mx-auto">
      <slot />
    </main>
  </UMain>
</template>
