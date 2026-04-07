import { storeToRefs } from 'pinia'
import { useImplementStore } from '../stores/useImplementStore'

interface ImplementPayload {
  organizacionId?: number
  flotaId?: number | null
  nombre: string
  tipo: string
  serie?: string | null
  estado?: 'OPERATIVO' | 'EN_REPARACION' | 'INACTIVO'
  descripcion?: string | null
  activo?: boolean
}

export const useImplements = () => {
  const toast = useToast()
  const store = useImplementStore()
  const { implementsList } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchImplements = async () => {
    isBootLoading.value = true
    try {
      await store.fetchImplements()
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar implementos', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createImplement = async (payload: ImplementPayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/implements', {
        method: 'POST',
        body: payload
      })
      store.addImplement({ ...payload, ...res } as any)
      toast.add({ title: 'Éxito', description: 'Implemento registrado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al registrar implemento', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateImplement = async (id: number, payload: Partial<ImplementPayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/implements/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updateImplementInStore({ ...payload, id } as any)
      toast.add({ title: 'Éxito', description: 'Implemento actualizado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar implemento', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteImplement = async (id: number) => {
    try {
      await $fetch(`/api/implements/${id}`, { method: 'DELETE' })
      store.deleteImplementInStore(id)
      toast.add({ title: 'Eliminado', description: 'Implemento eliminado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar el implemento', color: 'error' })
      return false
    }
  }

  return {
    implementsList,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchImplements,
    createImplement,
    updateImplement,
    deleteImplement
  }
}
