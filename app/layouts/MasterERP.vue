<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'

// 1. Definición de Props
interface Props {
  title: string
  navItems: NavigationMenuItem[][]
  iconName?: string
  colorFrom?: string
  colorTo?: string
  shadowColor?: string
  biometricosOnline?: boolean
  biometricosOffline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconName: 'ph:truck-fill',
  colorFrom: 'from-blue-400',
  colorTo: 'to-blue-600',
  shadowColor: 'shadow-blue-500/20',
  biometricosOnline: false,
  biometricosOffline: false
})

const {
  user,
  logout,
  isAuthenticated,
  isLoggingOut
} = await useAuthSession()

const userName = computed(() => user.value?.name || user.value?.email || 'Usuario')
const userAvatar = computed(() => user.value?.image || undefined)

const isSidebarOpen = ref(true)

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [{
    label: `${userName.value}`,
    avatar: { src: userAvatar.value },
    type: 'label'
  }],
  [{ label: 'Mi Perfil', icon: 'i-lucide-user', to: '/profile' }],
  [{
    label: isLoggingOut.value ? 'Cerrando sesion...' : 'Cerrar sesion',
    icon: 'i-lucide-log-out',
    disabled: isLoggingOut.value,
    onSelect: () => logout()
  }]
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-model:open="isSidebarOpen"
      collapsible
      resizable
      :min-size="16"
      :default-size="18"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div
            class="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-300/80 dark:border-white/20 bg-white/90 dark:bg-white/95 p-1.5 group-hover:scale-105 transition-transform duration-300"
          >
            <img src="/logo2.png" alt="Logo" class="w-full h-full object-contain" />
          </div>

          <div v-if="!collapsed" class="min-w-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-primary truncate">
              TGI
            </p>
            <h1 class="text-lg font-bold text-highlighted tracking-tight truncate leading-tight">
              {{ title }}
            </h1>
          </div>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navItems"
          orientation="vertical"
          variant="pill"
          class="space-y-1"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="main-content">
      <template #header>
        <UDashboardNavbar>
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
         
            <UColorModeButton />

            <UDropdownMenu
              :items="dropdownItems"
              :content="{ align: 'end', sideOffset: 8 }"
              :ui="{ content: 'w-48' }"
            >
              <UChip
                position="bottom-right"
                inset
                :color="isAuthenticated ? 'success' : 'error'"
              >
                <UAvatar
                  :src="userAvatar"
                  :alt="userName"
                  size="sm"
                />
              </UChip>
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
