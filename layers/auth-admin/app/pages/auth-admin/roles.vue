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

const page = ref(1)
const itemsPerPage = 30

// --- LÓGICA DE FILTRADO ---
const filteredFrontendRoutes = computed(() => {
  const term = q.value.toLowerCase().trim()
  return moduleRoutes.value
    .filter(r => r.tipoRuta === 'frontend')
    .filter(r => r.url.toLowerCase().includes(term) || r.nombre.toLowerCase().includes(term))
    .sort((a, b) => a.url.localeCompare(b.url))
})

const pagedFrontendRoutes = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredFrontendRoutes.value.slice(start, start + itemsPerPage)
})

const totalRoutes = computed(() => filteredFrontendRoutes.value.length)

const handleSaveRole = async (payload: any) => {
  const success = await createRole(payload)
  if (success) isModalOpen.value = false
}

watch(selectedRoleId, (id) => id && loadRolePermissions(id))
onMounted(() => loadBaseData())

watch([q, selectedRoleId, totalRoutes], () => {
  page.value = 1
})
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Roles</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Seguridad</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Gestión de Roles</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UButton
          label="Nuevo Rol"
          icon="i-lucide-plus"
          size="sm"
          color="brand"
          class="font-bold"
          @click="isModalOpen = true"
        />
        <UButton
          icon="i-lucide-save"
          size="sm"
          color="brand"
          :loading="isSaving"
          :disabled="!selectedRoleId"
          @click="saveRolePermissions"
          class="font-bold px-6 shadow-lg shadow-brand-500/10"
        >
          Guardar Cambios
        </UButton>
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
        <div class="flex items-center gap-2 min-w-[280px]">
          <span class="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap tracking-widest">Perfil:</span>
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

        <div class="h-4 w-[1px] bg-slate-100 mx-2"></div>

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
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            {{ filteredFrontendRoutes.length }} Interfaces cargadas
          </span>
        </div>
      </div>

      <main class="flex-1 overflow-auto relative custom-scrollbar">
        <template v-if="selectedRoleId">
          <table class="w-full text-sm border-collapse">
            <thead class="sticky top-0 z-20 bg-slate-50/90 backdrop-blur border-b border-slate-100">
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="p-4 text-left min-w-[300px]">Página / Sección</th>
                <th v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="p-4 text-center w-28">
                  {{ a }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="route in pagedFrontendRoutes" :key="route.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <td class="p-4">
                  <div class="flex flex-col leading-tight">
                    <span class="font-bold text-[13px] text-slate-900 group-hover:text-brand-500 transition-colors italic">
                      {{ route.url }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-70 mt-0.5">{{ route.nombre }}</span>
                  </div>
                </td>

                <td v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="p-4 text-center">
                  <div class="flex justify-center" v-if="roleRoutePermissionsDraft[route.id]">
                    <input
                      v-model="roleRoutePermissionsDraft[route.id][a]"
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-200 text-brand-500 accent-brand-500 cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="totalRoutes === 0" class="p-20 text-center opacity-30">
            <UIcon name="i-lucide-search-x" class="w-12 h-12 mx-auto mb-2" />
            <p class="text-[10px] font-black uppercase">Sin resultados para "{{ q }}"</p>
          </div>
        </template>

        <div v-else class="h-full flex flex-col items-center justify-center py-32 text-slate-400 opacity-70 bg-slate-50/40">
          <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 mb-4 animate-pulse" />
          <p class="text-[10px] font-black uppercase tracking-[0.3em]">Selecciona un rol para comenzar</p>
        </div>
      </main>

      <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Total: {{ totalRoutes }} interfaces
        </span>
        <UPagination
          v-if="totalRoutes > itemsPerPage"
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total="totalRoutes"
          size="xs"
        />
      </div>
    </div>

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