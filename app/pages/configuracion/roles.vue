<script setup lang="ts">
const { 
  roles, moduleRoutes, users, isBootLoading, isSaving, isActionLoading,
  selectedRoleId, selectedUserId, selectedModuleRouteId,
  roleRoutePermissionsDraft, userRoleIdsDraft, relatedRouteIdsDraft,
  loadAll, loadRolePermissions, saveRolePermissions,
  loadRelatedRoutes, saveRelatedRoutes,
  loadUserRoles, saveUserRoles
} = useSecurityManager()

const activeSection = ref<'roles' | 'paginas' | 'usuarios'>('roles')
const roleSearch = ref('')
const userSearch = ref('')
const moduleRouteSearch = ref('')
const relatedRouteSearch = ref('')

// --- MODALES ---
const roleModalOpen = ref(false)
const roleModalValue = ref(null)
const userModalOpen = ref(false)
const userModalValue = ref(null)
const moduleRouteModalOpen = ref(false)
const moduleRouteModalValue = ref(null)

// --- COMPUTED FILTERS (TUS FILTROS ORIGINALES) ---
const filteredRoles = computed(() => roles.value.filter(r => r.nombre.toLowerCase().includes(roleSearch.value.toLowerCase())))
const filteredUsers = computed(() => users.value.filter(u => u.name.toLowerCase().includes(userSearch.value.toLowerCase())))
const frontendProtectedRoutes = computed(() => moduleRoutes.value.filter(r => r.tipoRuta === 'frontend' && r.protegida))
const backendProtectedRoutes = computed(() => moduleRoutes.value.filter(r => r.tipoRuta === 'backend' && r.protegida))

// Todas las rutas protegidas (frontend + backend) — se usa en la matriz de permisos
const allProtectedRoutes = computed(() => {
  return moduleRoutes.value
    .filter(r => r.protegida)
    .sort((a, b) => a.url.localeCompare(b.url))
})

// Aplicar búsqueda rápida sobre la lista completa
const filteredAllProtectedRoutes = computed(() => {
  const q = moduleRouteSearch.value.toLowerCase().trim()
  if (!q) return allProtectedRoutes.value
  return allProtectedRoutes.value.filter(r => (r.url || '').toLowerCase().includes(q) || (r.nombre || '').toLowerCase().includes(q) || String(r.id) === q)
})

// Filtro de rutas relacionadas por búsqueda
const filteredRelatedCandidates = computed(() => {
  return backendProtectedRoutes.value.filter(r => r.url.toLowerCase().includes(relatedRouteSearch.value.toLowerCase()))
})

// --- WATCHERS ---
watch(selectedRoleId, (id) => id && loadRolePermissions(id), { immediate: true })
watch(selectedUserId, (id) => id && loadUserRoles(id), { immediate: true })
watch(selectedModuleRouteId, (id) => id && loadRelatedRoutes(id), { immediate: true })

onMounted(() => loadAll())

// --- FUNCIONES LOCALES ---
const toggleUserRole = (id: number) => {
  userRoleIdsDraft.value.has(id) ? userRoleIdsDraft.value.delete(id) : userRoleIdsDraft.value.add(id)
}
const toggleRelatedRoute = (id: number) => {
  relatedRouteIdsDraft.value.has(id) ? relatedRouteIdsDraft.value.delete(id) : relatedRouteIdsDraft.value.add(id)
}
</script>

<template>
  
  <div class="p-6 w-full mx-auto space-y-6">
    <header class="flex flex-col md:flex-row justify-between items-end gap-4">
      <div>
        <p class="text-xs font-bold text-primary uppercase">Administración</p>
        <h1 class="text-2xl font-black text-highlighted">Seguridad y Accesos</h1>
      </div>
      <div class="bg-elevated p-1 rounded-lg border border-default flex gap-1">
        <button v-for="s in ['roles', 'paginas', 'usuarios']" :key="s" 
          @click="activeSection = s" 
          :class="activeSection === s ? 'bg-default shadow-sm text-primary' : 'text-muted'"
          class="px-4 py-1.5 rounded-md text-sm font-bold capitalize transition">
          {{ s }}
        </button>
      </div>
    </header>

    <UAlert v-if="isBootLoading" title="Cargando sistema..." icon="i-lucide-loader" color="primary" variant="soft" />

    <template v-if="activeSection === 'roles'">
      <div class="space-y-6">
       

        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="font-bold">Matriz de Permisos</h2>
              
              <UButton icon="i-lucide-save" :loading="isSaving" @click="saveRolePermissions">Guardar Cambios</UButton>
            </div>
          </template>
          <div class="p-4 flex items-center gap-4">
            <label class="w-max">Filtrar rutas:</label>
            <UInput v-model="moduleRouteSearch" placeholder="Buscar ruta (url, nombre o id)..." icon="i-lucide-search" class="w-80" />
            <label class="w-max">Seleccionar rol:</label>
            <USelect v-model="selectedRoleId" :items="filteredRoles.map(r => ({label: r.nombre, value: r.id}))" placeholder="Selecciona un rol..." />
                <UButton icon="i-lucide-plus" size="xs" @click="roleModalOpen = true">Crear Rol</UButton>
                <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="soft" :disabled="!selectedRoleId">Editar</UButton>
            
          </div>
          <div class="overflow-x-auto border border-default rounded-xl">
            <table class="w-full text-sm">
              <thead class="bg-elevated border-b border-default text-muted font-bold">
                <tr>
                  <th class="p-4 text-left">Página / URL</th>
                  <th v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="text-center capitalize px-2">{{ a }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="route in filteredAllProtectedRoutes" :key="route.id" class="border-b border-default hover:bg-elevated/50">
                  <td class="p-4">
                    <div class="font-bold text-highlighted">{{ route.url }}</div>
                    <div class="text-xs text-muted">{{ route.nombre }}</div>
                  </td>
                  <td v-for="a in ['ver', 'agregar', 'editar', 'eliminar']" :key="a" class="text-center">
                    <input v-if="roleRoutePermissionsDraft[route.id]" 
                      v-model="roleRoutePermissionsDraft[route.id][a]" 
                      type="checkbox" class="h-4 w-4 accent-primary cursor-pointer" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </template>

    <template v-else-if="activeSection === 'paginas'">
      <div class="grid lg:grid-cols-3 gap-6">
        <UCard class="lg:col-span-1">
          <template #header><h2 class="font-bold">Páginas (Frontend)</h2></template>
          <UInput v-model="moduleRouteSearch" icon="i-lucide-search" placeholder="Filtrar páginas..." class="mb-4" />
          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            <button v-for="route in frontendProtectedRoutes" :key="route.id" 
              @click="selectedModuleRouteId = route.id"
              :class="selectedModuleRouteId === route.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-elevated'"
              class="w-full text-left p-3 border rounded-xl transition">
              <div class="text-sm font-bold">{{ route.url }}</div>
              <div class="text-xs text-muted">{{ route.nombre }}</div>
            </button>
          </div>
        </UCard>

        <UCard v-if="selectedModuleRouteId" class="lg:col-span-2">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="font-bold">APIs Backend Relacionadas</h2>
              <UButton icon="i-lucide-save" :loading="isSaving" @click="saveRelatedRoutes">Guardar Relación</UButton>
            </div>
          </template>
          <UInput v-model="relatedRouteSearch" icon="i-lucide-search" placeholder="Buscar API..." class="mb-4" />
          <div class="grid md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
            <label v-for="api in filteredRelatedCandidates" :key="api.id" 
              class="flex items-center gap-3 p-3 border border-default rounded-xl cursor-pointer hover:bg-elevated">
              <input type="checkbox" :checked="relatedRouteIdsDraft.has(api.id)" @change="toggleRelatedRoute(api.id)" class="h-4 w-4" />
              <div class="min-w-0">
                <div class="text-xs font-black text-primary">{{ api.metodo }}</div>
                <div class="text-sm font-bold truncate">{{ api.url }}</div>
                <div class="text-[10px] text-muted truncate">{{ api.nombre }}</div>
              </div>
            </label>
          </div>
        </UCard>
      </div>
    </template>

    <template v-else-if="activeSection === 'usuarios'">
      <div class="grid lg:grid-cols-3 gap-6">
        <UCard class="lg:col-span-1">
          <template #header><h2 class="font-bold">Usuarios</h2></template>
          <UInput v-model="userSearch" icon="i-lucide-search" placeholder="Buscar usuario..." class="mb-4" />
          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            <button v-for="u in filteredUsers" :key="u.id" 
              @click="selectedUserId = u.id"
              :class="selectedUserId === u.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-elevated'"
              class="w-full text-left p-4 border rounded-xl transition">
              <div class="font-bold text-sm">{{ u.name }}</div>
              <div class="text-xs text-muted">{{ u.email }}</div>
            </button>
          </div>
        </UCard>

        <UCard v-if="selectedUserId" class="lg:col-span-2">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="font-bold">Roles Asignados</h2>
              <UButton icon="i-lucide-save" :loading="isSaving" @click="saveUserRoles">Sincronizar Roles</UButton>
            </div>
          </template>
          <div class="grid md:grid-cols-2 gap-4">
            <label v-for="role in roles" :key="role.id" 
              class="flex items-start gap-4 p-4 border border-default rounded-2xl cursor-pointer hover:bg-elevated">
              <input type="checkbox" :checked="userRoleIdsDraft.has(role.id)" @change="toggleUserRole(role.id)" class="h-5 w-5 mt-1" />
              <div>
                <p class="font-black text-sm">{{ role.nombre }}</p>
                <p class="text-xs text-muted">{{ role.descripcion }}</p>
              </div>
            </label>
          </div>
        </UCard>
      </div>
    </template>

    <RoleFormModal v-model="roleModalOpen" :role="roleModalValue" @save="loadAll" />
    <UserFormModal v-model="userModalOpen" :user="userModalValue" @save="loadAll" />
  </div>
</template>