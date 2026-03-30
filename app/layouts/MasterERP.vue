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
  <NuxtLink 
    to="/" 
    class="flex items-center justify-center w-full py-2"
    :class="[collapsed ? '' : 'px-4 flex-col items-start']"
    title="Volver al inicio"
  >
    <div 
      v-if="collapsed" 
      class="bg-red-600 w-10 h-10 rounded-xl shadow-md flex items-center justify-center overflow-hidden"
    >
      <img 
        src="/images/pedregalIcon.png" 
        alt="P" 
        class="w-6 h-4 object-contain"
      />
    </div>

    <template v-else>
      <div class="flex items-center">
        <UIcon 
          name="i-lucide-chevron-left" 
          class="w-5 h-5 mr-1 text-brand-500 transition-transform duration-300 group-hover:-translate-x-1"
        />
        <LogoPedregal class="text-brand-500 dark:text-white w-[130px] h-auto mb-1" />
      </div>
      
      <div class="flex items-center gap-2">
        <div class="h-[1px] w-8 bg-slate-300 dark:bg-white/20" />
        <span class="text-[9px] font-black uppercase tracking-[0.25em] text-slate-950 dark:text-white">
          {{ title }}
        </span>
      </div>
    </template>
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
