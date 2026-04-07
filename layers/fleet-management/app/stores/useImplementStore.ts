import { defineStore } from 'pinia'
import type { Implement } from '~~/shared/types/db'

export const useImplementStore = defineStore('implements', () => {
  const implementsList = ref<Implement[]>([])
  const isLoading = ref(false)

  const fetchImplements = async () => {
    if (implementsList.value.length > 0) return
    isLoading.value = true
    try {
      implementsList.value = await $fetch<Implement[]>('/api/implements')
    } finally {
      isLoading.value = false
    }
  }

  const addImplement = (newItem: Implement) => {
    implementsList.value = [newItem, ...implementsList.value]
  }

  const updateImplementInStore = (updatedItem: Implement) => {
    const index = implementsList.value.findIndex(item => item.id === updatedItem.id)
    if (index !== -1) {
      const next = [...implementsList.value]
      next[index] = updatedItem
      implementsList.value = next
    }
  }

  const deleteImplementInStore = (id: number) => {
    implementsList.value = implementsList.value.filter(item => item.id !== id)
  }

  const resetCache = () => { implementsList.value = [] }

  return {
    implementsList,
    isLoading,
    fetchImplements,
    addImplement,
    updateImplementInStore,
    deleteImplementInStore,
    resetCache
  }
})
