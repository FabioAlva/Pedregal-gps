import { defineStore } from 'pinia'
import type { InventoryPart } from '#shared/types/db'

export const useInventoryPartStore = defineStore('inventoryParts', () => {
  const parts = ref<InventoryPart[]>([])
  const isLoading = ref(false)

  const fetchParts = async (force = false) => {
    if (!force && parts.value.length > 0) return
    isLoading.value = true
    try {
      parts.value = await $fetch<InventoryPart[]>('/api/inventory/parts')
    } finally {
      isLoading.value = false
    }
  }

  const addPart = (part: InventoryPart) => {
    parts.value = [part, ...parts.value]
  }

  const updatePartInStore = (part: InventoryPart) => {
    const index = parts.value.findIndex(item => item.id === part.id)
    if (index !== -1) {
      const next = [...parts.value]
      next[index] = part
      parts.value = next
    }
  }

  const deletePartInStore = (id: number) => {
    parts.value = parts.value.filter(item => item.id !== id)
  }

  const resetCache = () => { parts.value = [] }

  return {
    parts,
    isLoading,
    fetchParts,
    addPart,
    updatePartInStore,
    deletePartInStore,
    resetCache
  }
})
