import { defineStore } from 'pinia'
import type { MaintenanceLog } from '#shared/types/db'

export const useWorkOrderStore = defineStore('workOrders', () => {
  const workOrders = ref<MaintenanceLog[]>([])
  const isLoading = ref(false)

  const fetchWorkOrders = async (force = false) => {
    if (!force && workOrders.value.length > 0) return
    isLoading.value = true
    try {
      workOrders.value = await $fetch<MaintenanceLog[]>('/api/work-orders')
    } finally {
      isLoading.value = false
    }
  }

  const addWorkOrder = (order: MaintenanceLog) => {
    workOrders.value = [order, ...workOrders.value]
  }

  const updateWorkOrderInStore = (order: MaintenanceLog) => {
    const index = workOrders.value.findIndex(item => item.id === order.id)
    if (index !== -1) {
      const next = [...workOrders.value]
      next[index] = order
      workOrders.value = next
    }
  }

  const deleteWorkOrderInStore = (id: number) => {
    workOrders.value = workOrders.value.filter(item => item.id !== id)
  }

  const resetCache = () => { workOrders.value = [] }

  return {
    workOrders,
    isLoading,
    fetchWorkOrders,
    addWorkOrder,
    updateWorkOrderInStore,
    deleteWorkOrderInStore,
    resetCache
  }
})
