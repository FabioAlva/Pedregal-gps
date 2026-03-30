<script setup lang="ts">
import { useAuthSession } from '#layers/auth-admin/app/composables/useAuthSession'

const toast = useToast()
const deniedMsg = useCookie('auth_denied_msg')

onMounted(() => {
  if (deniedMsg.value) {
    console.log("🚩 [MasterERP] Mensaje de cookie detectado:", deniedMsg.value)
    
    toast.add({
      title: 'Acceso Denegado',
      description: deniedMsg.value,
      icon: 'i-lucide-shield-ban'
    })

    // Limpiamos la cookie inmediatamente
    deniedMsg.value = null
  }
})

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
  <UMain class="min-h-screen bg-neutral-50 dark:bg-slate-950 transition-colors duration-300">
    <header 
      class="w-full border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
       <NuxtLink to="/" class="flex flex-col justify-center group max-w-fit px-2 py-1">
    <LogoPedregal 
      class="text-brand-500 dark:text-white w-[130px] h-auto mb-1 transition-transform duration-300 group-hover:scale-[1.02]" 
    />
    
    <div class="flex items-center gap-2">
      <div class="h-[1px] w-5 bg-slate-300 dark:bg-white/20" />
      <span class="text-[9px] font-black uppercase tracking-[0.25em] text-slate-950 dark:text-white leading-none">
        Dashboard
      </span>
    </div>
  </NuxtLink>
      </div>

      <div class="flex items-center gap-4">
        <UColorModeButton />
        
        <UDropdownMenu 
          :items="dropdownItems"
          :content="{ align: 'end', sideOffset: 8 }"
          :ui="{ content: 'w-48 dark:bg-slate-900 dark:border-white/10' }"
        >
          <UChip
            position="bottom-right"
            inset
            :color="isAuthenticated ? 'success' : 'error'"
          >
            <UAvatar 
              :src="userAvatar" 
              alt="avatar" 
              size="sm" 
              class="ring-1 ring-slate-200 dark:ring-white/20" 
            />
          </UChip>
        </UDropdownMenu>
      </div>
    </header>

    <main class="p-6 max-w-7xl mx-auto">
      <slot />
    </main>
  </UMain>
</template>