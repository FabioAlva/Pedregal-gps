// layers/auth-admin/app/stores/useRoleStore.ts
export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])
  const isLoading = ref(false)

  const fetchRoles = async () => {
    if (roles.value.length > 0) return
    isLoading.value = true
    try {
      roles.value = await $fetch<Role[]>('/api/roles')
    } finally {
      isLoading.value = false
    }
  }

  const addRole = (newRole: Role) => {
    roles.value = [...roles.value, newRole]
  }

  const updateRoleInStore = (updatedRole: Role) => {
    const index = roles.value.findIndex(r => r.id === updatedRole.id)
    if (index !== -1) {
      const newArray = [...roles.value]
      newArray[index] = updatedRole
      roles.value = newArray
    }
  }

  return { roles, isLoading, fetchRoles, addRole, updateRoleInStore }
})