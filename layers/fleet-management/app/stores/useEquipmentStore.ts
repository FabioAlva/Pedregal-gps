import { defineStore } from 'pinia'
import type { Equipment } from '~~/shared/types/db'

export const useEquipmentStore = defineStore('equipment', () => {
  const equipments = ref<Equipment[]>([])
  const isLoading = ref(false)

  const fetchEquipments = async () => {
    if (equipments.value.length > 0) return
    isLoading.value = true
    try {
      equipments.value = await $fetch<Equipment[]>('/api/equipment')
    } finally {
      isLoading.value = false
    }
  }

  const addEquipment = (newDev: Equipment) => {
    equipments.value = [newDev, ...equipments.value]
  }

  const resetCache = () => { equipments.value = [] } // <-- AÑADE ESTO

  const updateEquipmentInStore = (updatedDev: Equipment) => {
    const index = equipments.value.findIndex(e => e.id === updatedDev.id)
    if (index !== -1) {
      const newArray = [...equipments.value]
      newArray[index] = updatedDev
      equipments.value = newArray
    }
  }

  const deleteFromStore = (id: number) => {
    equipments.value = equipments.value.filter(e => e.id !== id)
  }

  return { 
    equipments, 
    isLoading, 
    fetchEquipments, 
    addEquipment, 
    updateEquipmentInStore, 
    deleteFromStore ,
    resetCache // <-- EXPÓN ESTO
  }
})