<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { 
  users, 
  roles, 
  isBootLoading, 
  isCreatingUser,
  isUpdating,
  isSyncingRoles,
  selectedUserId, 
  userRoleIdsDraft, 
  loadUsersAndRoles, 
  loadUserRoles, 
  saveUserRoles,
  createUser,
  updateUser
} = useUsersManager()

const q = ref('')
const userModalOpen = ref(false)
const userModalValue = ref<any>(null)

const openCreateModal = () => {
  userModalValue.value = null
  userModalOpen.value = true
}

const openEditModal = () => {
  const userToEdit = users.value.find(u => u.id === selectedUserId.value)
  if (userToEdit) {
    userModalValue.value = { ...userToEdit }
    userModalOpen.value = true
  }
}

const handleUserSave = async (payload: any) => {
  if (payload.id) {
    await updateUser(payload.id, payload);
  } else {
    await createUser(payload);
  }
  userModalOpen.value = false;
};

const filteredUsers = computed(() => {
  const term = q.value.toLowerCase().trim()
  return users.value.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
})

const toggleRole = (roleId: number) => {
  if (userRoleIdsDraft.value.has(roleId)) userRoleIdsDraft.value.delete(roleId)
  else userRoleIdsDraft.value.add(roleId)
}

watch(selectedUserId, (uid) => uid && loadUserRoles(uid))
onMounted(() => loadUsersAndRoles())
</script>

<template>
  <div class="flex h-full w-full bg-background overflow-hidden border-t border-default">
    
    <aside class="w-[300px] shrink-0 border-r border-default flex flex-col bg-elevated/10">
      <div class="px-6 py-5 border-b border-default shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Cuentas</p>
            <h2 class="text-lg font-bold text-highlighted">Directorio</h2>
          </div>
          <div class="flex gap-1">
            <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="primary" @click="openCreateModal" />
            <UButton 
              icon="i-lucide-pencil" 
              size="xs" 
              variant="ghost" 
              color="neutral" 
              :disabled="!selectedUserId" 
              @click="openEditModal" 
            />
          </div>
        </div>
      </div>

      <div class="px-4 py-3 border-b border-default bg-default/30">
        <UInput 
          v-model="q" 
          icon="i-lucide-search" 
          placeholder="Buscar usuario..." 
          variant="subtle" 
          size="xs"
          class="w-full"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        <button 
          v-for="u in filteredUsers" :key="u.id" 
          @click="selectedUserId = u.id"
          :class="selectedUserId === u.id 
            ? 'bg-primary/10 border-primary ring-1 ring-primary/20 shadow-sm' 
            : 'bg-elevated/40 border-default hover:border-primary/50 hover:bg-elevated'"
          class="w-full text-left p-4 border rounded-xl transition-all duration-200 group relative cursor-pointer"
        >
          <div class="flex justify-between items-start mb-1">
            <div class="text-[13px] font-black group-hover:text-primary transition-colors truncate pr-6">
              {{ u.name }}
            </div>
            <UIcon 
              name="i-lucide-chevron-right" 
              class="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
          <div class="text-[10px] text-muted font-bold truncate opacity-70">{{ u.email }}</div>
        </button>

        <div v-if="filteredUsers.length === 0" class="py-10 text-center opacity-40">
          <UIcon name="i-lucide-search-x" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-[10px] font-bold uppercase tracking-widest">Sin resultados</p>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      
      <header class="px-6 py-5 border-b border-default flex items-center justify-between shrink-0 bg-elevated/20">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Seguridad & Usuarios</p>
          <h1 class="text-2xl font-bold text-highlighted tracking-tight">Privilegios de Acceso</h1>
        </div>
        <div class="flex items-center gap-3">
          <UButton 
            v-if="selectedUserId"
            icon="i-lucide-save" 
            size="sm"
            color="primary"
            :loading="isSyncingRoles" 
            @click="saveUserRoles"
            class="font-bold px-8 shadow-lg shadow-primary/10"
          >
            Sincronizar Roles
          </UButton>
        </div>
      </header>

      <div class="flex-1 overflow-hidden relative">
        <div v-if="selectedUserId" class="h-full overflow-y-auto p-6 custom-scrollbar">
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label 
              v-for="role in roles" :key="role.id" 
              class="flex items-start gap-4 p-4 border border-default rounded-xl cursor-pointer hover:bg-elevated transition-all group relative overflow-hidden"
              :class="userRoleIdsDraft.has(role.id) ? 'border-primary bg-primary/5' : 'bg-elevated/10 opacity-80'"
            >
              <input 
                type="checkbox" 
                :checked="userRoleIdsDraft.has(role.id)" 
                @change="toggleRole(role.id)"
                class="accent-primary h-4 w-4 mt-1 z-10" 
              />
              <div class="min-w-0 flex-1 z-10">
                <div class="text-[12px] font-black text-highlighted group-hover:text-primary transition-colors uppercase tracking-tight">
                  {{ role.nombre }}
                </div>
                <div class="text-[10px] text-muted italic font-medium mt-1 leading-snug">
                  {{ role.descripcion || 'Sin descripción definida.' }}
                </div>
              </div>
              <div v-if="userRoleIdsDraft.has(role.id)" class="absolute left-0 top-0 bottom-0 bg-primary"></div>
            </label>
          </div>
        </div>
        
        <div v-else class="h-full flex flex-col items-center justify-center text-muted opacity-40 bg-elevated/5">
          <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 mb-4 animate-pulse" />
          <p class="text-[10px] font-black uppercase tracking-[0.3em]">Selecciona un usuario para gestionar sus privilegios</p>
        </div>
      </div>
    </main>

<UserFormModal 
  v-model="userModalOpen" 
  :user="userModalValue"
  :loading="userModalValue ? isUpdating : isCreatingUser" 
  @save="handleUserSave" 
/>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(var(--color-primary-500), 0.1); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--color-primary-500), 0.3); }
</style>