import { storeToRefs } from 'pinia'
import { useInventoryPartStore } from '../stores/useInventoryPartStore'

interface InventoryPartPayload {
  nombre: string
  sku?: string | null
  unidad?: string | null
  stockActual?: number | null
  stockMinimo?: number | null
  ubicacion?: string | null
  descripcion?: string | null
  activo?: boolean
  organizacionId?: number | null
}

export const useInventoryParts = () => {
  const toast = useToast()
  const store = useInventoryPartStore()
  const { parts } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchParts = async (force = false) => {
    isBootLoading.value = true
    try {
      await store.fetchParts(force)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar repuestos', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createPart = async (payload: InventoryPartPayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/inventory/parts', {
        method: 'POST',
        body: payload
      })
      store.addPart({ ...payload, ...res } as any)
      toast.add({ title: 'Exito', description: 'Repuesto creado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al crear repuesto', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updatePart = async (id: number, payload: Partial<InventoryPartPayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/inventory/parts/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updatePartInStore({ ...payload, id } as any)
      toast.add({ title: 'Exito', description: 'Repuesto actualizado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar repuesto', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deletePart = async (id: number) => {
    try {
      await $fetch(`/api/inventory/parts/${id}`, { method: 'DELETE' })
      store.deletePartInStore(id)
      toast.add({ title: 'Eliminado', description: 'Repuesto eliminado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar el repuesto', color: 'error' })
      return false
    }
  }

  return {
    parts,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchParts,
    createPart,
    updatePart,
    deletePart
  }
}
