<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { 
  roles, 
  moduleRoutes, 
  isBootLoading, 
  isSaving, 
  isCreatingRole,
  selectedRoleId, 
  roleRoutePermissionsDraft, 
  loadBaseData, 
  loadRolePermissions, 
  saveRolePermissions,
  createRole 
} = useRolesManager()

const q = ref('')
const isModalOpen = ref(false)

// --- LÓGICA DE FILTRADO ---
const filteredFrontendRoutes = computed(() => {
  const term = q.value.toLowerCase().trim()
  return moduleRoutes.value
    .filter(r => r.tipoRuta === 'frontend')
    .filter(r => r.url.toLowerCase().includes(term) || r.nombre.toLowerCase().includes(term))
    .sort((a, b) => a.url.localeCompare(b.url))
})

const handleSaveRole = async (payload: any) => {
  const success = await createRole(payload)
  if (success) isModalOpen.value = false
}

watch(selectedRoleId, (id) => id && loadRolePermissions(id))
onMounted(() => loadBaseData())
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-background">
    
    <header class="flex items-center justify-between px-6 py-5 border-b border-default shrink-0 bg-elevated/20">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 text-highlighted">Seguridad & Accesos</p>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">Gestión de Roles</h1>
      </div>
      <div class="flex items-center gap-3">
        <UButton 
          label="Nuevo Rol" 
          icon="i-lucide-plus" 
          size="sm" 
          color="primary" 
          variant="soft"
          @click="isModalOpen = true" 
          class="font-bold"
        />
        <UButton 
          icon="i-lucide-save" 
          size="sm"
          color="primary"
          :loading="isSaving" 
          :disabled="!selectedRoleId"
          @click="saveRolePermissions"
          class="font-bold px-6 shadow-lg shadow-primary/10"
        >
          Guardar Cambios
        </UButton>
      </div>
    </header>

    <div class="flex items-center gap-4 px-6 py-3 bg-default/30 border-b border-default shrink-0">
      <div class="flex items-center gap-2 min-w-[280px]">
        <span class="text-[10px] font-black uppercase text-muted whitespace-nowrap tracking-widest">Perfil:</span>
        <USelect 
          v-model="selectedRoleId" 
          :items="roles.map(r => ({label: r.nombre, value: r.id}))" 
          placeholder="Elige un rol para editar..." 
          size="xs"
          class="w-full"
          variant="subtle"
          icon="i-lucide-users"
        />
      </div>
      
      <div class="h-4 w-[1px] bg-default mx-2"></div>
      
      <div class="flex-1 max-w-md">
        <UInput 
          v-model="q" 
          icon="i-lucide-search" 
          placeholder="Buscar interfaz en la matriz..." 
          size="xs" 
          variant="subtle"
          :disabled="!selectedRoleId"
          class="w-full"
        />
      </div>

      <div v-if="selectedRoleId" class="hidden md:block ml-auto">
        <span class="text-[10px] font-black text-muted uppercase tracking-tighter">
          {{ filteredFrontendRoutes.length }} Interfaces cargadas
        </span>
      </div>
    </div>

    <main class="flex-1 overflow-auto relative custom-scrollbar bg-background">
      <template v-if="selectedRoleId">
        <table class="w-full text-sm border-collapse">
          <thead class="sticky top-0 z-20 bg-elevated/95 backdrop-blur-md border-b border-default">
            <tr class="text-[10px] font-black text-muted uppercase tracking-widest">
              <th class="p-4 text-left min-w-[300px]">Página / Sección</th>
              <th v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="p-4 text-center w-28">
                {{ a }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/50">
            <tr 
              v-for="route in filteredFrontendRoutes" :key="route.id" 
              class="hover:bg-primary/5 transition-colors group"
            >
              <td class="p-4">
                <div class="flex flex-col leading-tight">
                  <span class="font-bold text-[13px] text-highlighted group-hover:text-primary transition-colors italic">
                    {{ route.url }}
                  </span>
                  <span class="text-[10px] text-muted font-bold uppercase tracking-tighter opacity-70 mt-0.5">{{ route.nombre }}</span>
                </div>
              </td>

              <td v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="p-4 text-center">
                <div class="flex justify-center" v-if="roleRoutePermissionsDraft[route.id]">
                  <input 
                    v-model="roleRoutePermissionsDraft[route.id][a]" 
                    type="checkbox" 
                    class="h-4 w-4 rounded border-default text-primary accent-primary cursor-pointer hover:scale-110 transition-transform" 
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredFrontendRoutes.length === 0" class="p-20 text-center opacity-30">
          <UIcon name="i-lucide-search-x" class="w-12 h-12 mx-auto mb-2" />
          <p class="text-[10px] font-black uppercase">Sin resultados para "{{ q }}"</p>
        </div>
      </template>

      <div v-else class="h-full flex flex-col items-center justify-center py-32 text-muted opacity-40 bg-elevated/5">
        <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 mb-4 animate-pulse" />
        <p class="text-[10px] font-black uppercase tracking-[0.3em]">Selecciona un rol para comenzar</p>
      </div>
      
    </main>

    <RoleFormModal 
      v-model="isModalOpen"
      :loading="isCreatingRole"
      @save="handleSaveRole"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(var(--color-primary-500), 0.1); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--color-primary-500), 0.3); }
</style>