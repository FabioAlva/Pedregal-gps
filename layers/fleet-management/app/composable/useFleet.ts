import { useFleetStore } from "../stores/useFleetStore"

export const useFleet = () => {
  const toast = useToast()
  const fleetStore = useFleetStore()
  const { fleets } = storeToRefs(fleetStore)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchFleets = async () => {
    isBootLoading.value = true
    try {
      await fleetStore.fetchFleets()
    } catch (e) {
      toast.add({ title: 'Error', description: 'Fallo al cargar flotas', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

 const createFleet = async (formData: any) => {
  isSaving.value = true
  try {
   const { id, ...cleanData } = formData

    if (!cleanData.vencimientoSoat) cleanData.vencimientoSoat = null
    if (!cleanData.vencimientoTecnica) cleanData.vencimientoTecnica = null

    const res = await $fetch<any>('/api/fleets', {
      method: 'POST',
      body: cleanData, 
    })
    const newFleetFull = { ...cleanData, ...res }
    fleetStore.addFleet(newFleetFull)
    toast.add({ title: 'Éxito', description: 'Unidad registrada', color: 'success' })
    return true
  } catch (e) {
    toast.add({ title: 'Error', description: 'Error al crear', color: 'error' })
    return false
  } finally {
    isSaving.value = false
  }
}

const updateFleet = async (id: number | string, formData: any) => {
    isUpdating.value = true
    try {
      const cleanData = { ...formData }
      if (cleanData.vencimientoSoat) cleanData.vencimientoSoat = new Date(cleanData.vencimientoSoat)
      else cleanData.vencimientoSoat = null

      if (cleanData.vencimientoTecnica) cleanData.vencimientoTecnica = new Date(cleanData.vencimientoTecnica)
      else cleanData.vencimientoTecnica = null

      await $fetch(`/api/fleets/${id}`, { 
        method: 'PATCH', 
        body: cleanData 
      })

      fleetStore.updateFleetInStore({ ...cleanData, id })
      toast.add({ title: 'Éxito', description: 'Unidad actualizada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteFleet = async (id: number | string) => {
    try {
      await $fetch(`/api/fleets/${id}`, { method: 'DELETE' })
      fleetStore.deleteFleetInStore(id)
      toast.add({ title: 'Eliminado', description: 'Unidad fuera de sistema', color: 'success' })
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al eliminar', color: 'error' })
    }
  }

  return {
    fleets,
    isLoading: isBootLoading, // Aliasing para tu UI
    isSaving,
    isUpdating,
    fetchFleets,
    createFleet,
    updateFleet,
    deleteFleet
  }
}