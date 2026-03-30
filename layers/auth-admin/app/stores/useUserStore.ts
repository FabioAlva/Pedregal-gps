// layers/auth-admin/app/stores/useUserStore.ts
export const useUserStore = defineStore('user', () => {
  const users = ref<any[]>([])
  const isLoading = ref(false)

  const fetchUsers = async () => {
    if (users.value.length > 0) return
    isLoading.value = true
    try {
      users.value = await $fetch<any[]>('/api/users')
    } finally {
      isLoading.value = false
    }
  }

  const addUser = (newUser: any) => {
    users.value = [newUser, ...users.value]
  }

  return { users, isLoading, fetchUsers, addUser }
})