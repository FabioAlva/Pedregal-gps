<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'

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
  <div class="flex flex-col w-full">
    <div 
      class="flex flex-col w-full pt-8 pb-4" 
      :class="[collapsed ? 'items-center' : 'px-8 items-start']"
    >
      <NuxtLink 
        to="/" 
        class="group select-none"
        :class="[collapsed ? 'flex justify-center' : 'flex flex-col']"
      >
        <div 
          v-if="collapsed" 
          class="bg-brand-500 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center overflow-hidden"
        >
          <img 
            src="/images/pedregal-Icon.png" 
            alt="P" 
            class="w-6 h-4 object-contain brightness-0 invert"
          />
        </div>

        <template v-else>
          <div class="flex flex-col  ">
            <div class="flex flex-row justify-center items-center ">
               <UIcon 
      name="i-lucide-chevron-left" 
      class="w-5 h-5 -ml-1 mr-3 text-brand-500/50 group-hover:text-brand-500 transition-all duration-300 group-hover:-translate-x-1"
    />
    <div class = "flex flex-col">
            <h2 class="font-serif text-2xl xl:text-3xl font-bold text-brand-500 tracking-tighter leading-none">
              Pedregal
            </h2>
            <p class="font-serif italic font-medium text-brand-500 text-[10px] lowercase opacity-80 mt-1 ml-0.5 tracking-tight">
              the fruit company
            </p>
            </div>
          </div>
 </div>
          <div class="flex items-center gap-2 mt-2">
            <div class="h-px w-6 bg-brand-500/30" />
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 leading-none">
              {{ title }}
            </span>
          </div>
        </template>
      </NuxtLink>
    </div>

    <div v-if="!collapsed" class="px-8 mb-2">
      <div class="h-[1px] w-full bg-slate-100 dark:bg-white/5" />
    </div>
  </div>
</template>

  <template #default="{ collapsed }">
        <div :class="[collapsed ? '' : 'px-2']">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="navItems"
            orientation="vertical"
            variant="pill"
            class="space-y-1 mt-4 font-sans"
          />
        </div>
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
