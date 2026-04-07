import { storeToRefs } from 'pinia'
import type { NewInspection } from '#shared/types/db'
import { useInspectionStore } from '../stores/useInspectionStore'

export const useInspections = () => {
  const toast = useToast()
  const store = useInspectionStore()
  const { inspections, details } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)

  const fetchInspections = async (force = false) => {
    isBootLoading.value = true
    try {
      await store.fetchInspections(force)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar inspecciones', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const fetchInspectionDetail = async (id: number) => {
    try {
      return await store.fetchInspectionDetail(id)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo cargar el detalle', color: 'error' })
      return null
    }
  }

  const createInspection = async (payload: NewInspection & { issues?: any[] }) => {
    isSaving.value = true
    try {
      await $fetch<any>('/api/inspections', {
        method: 'POST',
        body: payload
      })
      await store.fetchInspections(true)
      toast.add({ title: 'Exito', description: 'Inspeccion registrada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al registrar inspeccion', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    inspections,
    details,
    isLoading: isBootLoading,
    isSaving,
    fetchInspections,
    fetchInspectionDetail,
    createInspection
  }
}
