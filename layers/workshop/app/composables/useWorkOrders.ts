import { storeToRefs } from 'pinia'
import { useWorkOrderStore } from '../stores/useWorkOrderStore'

interface WorkOrderPayload {
  flotaId: number
  scheduleId?: number | null
  gastoId?: number | null
  realizadoPor?: string | null
  kmAlRealizar?: number | null
  horasAlRealizar?: number | null
  descripcion?: string | null
  repuestosUsados?: Array<{ nombre: string; cantidad: number; costo: number }>
  fotosUrl?: string[]
  fecha?: string | null
}

export const useWorkOrders = () => {
  const toast = useToast()
  const store = useWorkOrderStore()
  const { workOrders } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchWorkOrders = async (force = false) => {
    isBootLoading.value = true
    try {
      await store.fetchWorkOrders(force)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar las reparaciones', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createWorkOrder = async (payload: WorkOrderPayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/work-orders', {
        method: 'POST',
        body: payload
      })
      store.addWorkOrder({ ...payload, ...res } as any)
      toast.add({ title: 'Exito', description: 'Orden registrada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al registrar orden', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateWorkOrder = async (id: number, payload: Partial<WorkOrderPayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updateWorkOrderInStore({ ...payload, id } as any)
      toast.add({ title: 'Exito', description: 'Orden actualizada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar orden', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteWorkOrder = async (id: number) => {
    try {
      await $fetch(`/api/work-orders/${id}`, { method: 'DELETE' })
      store.deleteWorkOrderInStore(id)
      toast.add({ title: 'Eliminado', description: 'Orden eliminada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar la orden', color: 'error' })
      return false
    }
  }

  return {
    workOrders,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchWorkOrders,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder
  }
}
