import { storeToRefs } from 'pinia'
import { useEquipmentStore } from '../stores/useEquipmentStore'

export function useEquipment() {
  const toast = useToast()
  const store = useEquipmentStore()
  const { equipments } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchEquipments = async () => {
    isBootLoading.value = true
    try {
      await store.fetchEquipments()
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo cargar el inventario', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

const createEquipment = async (payload: any) => {
  isSaving.value = true
  try {
    const cleanPayload = {
      ...payload,
      estadoId: payload.estadoId || 1, // 1: Disponible
      tipoId: payload.tipoId || 1,     // 1: GPS
      especificaciones: payload.especificaciones || { imei: payload.codigo, color: '#3b82f6' }
    }
    const res = await $fetch<any>('/api/equipment', { method: 'POST', body: cleanPayload })
    store.addEquipment({ ...cleanPayload, ...res })
    toast.add({ title: 'Éxito', description: 'Equipo registrado', color: 'success' })
    return true
  } catch (e) {
    toast.add({ title: 'Error', description: 'Fallo al registrar', color: 'error' })
    return false
  } finally {
    isSaving.value = false
  }
}

  const updateEquipment = async (id: number, payload: any) => {
    isUpdating.value = true
    try {
      await $fetch<any>(`/api/equipment/${id}`, { method: 'PATCH', body: payload })
      store.updateEquipmentInStore({ ...payload, id })
      toast.add({ title: 'Éxito', description: 'Equipo actualizado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Fallo al actualizar', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteEquipment = async (id: number) => {
    try {
      await $fetch<any>(`/api/equipment/${id}`, { method: 'DELETE' })
      store.deleteFromStore(id)
      toast.add({ title: 'Eliminado', description: 'Equipo fuera de sistema', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar', color: 'error' })
      return false
    }
  }

  return {
    equipments,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment
  }
}