import { storeToRefs } from 'pinia'
import { useInspectionTemplateStore } from '../stores/useInspectionTemplateStore'

interface TemplatePayload {
  nombre: string
  descripcion?: string | null
  activo?: boolean
  esquema: Array<{
    id: string
    label: string
    tipo: 'boolean' | 'texto' | 'foto' | 'numero' | 'seleccion'
    opciones?: string[]
    requerido: boolean
    alertaSi?: boolean
  }>
}

export const useInspectionTemplates = () => {
  const toast = useToast()
  const store = useInspectionTemplateStore()
  const { templates } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchTemplates = async (force = false) => {
    isBootLoading.value = true
    try {
      await store.fetchTemplates(force)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar plantillas', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createTemplate = async (payload: TemplatePayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/inspections/templates', {
        method: 'POST',
        body: payload
      })
      store.addTemplate({ ...payload, ...res } as any)
      toast.add({ title: 'Exito', description: 'Plantilla creada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al crear plantilla', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateTemplate = async (id: number, payload: Partial<TemplatePayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/inspections/templates/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updateTemplateInStore({ ...payload, id } as any)
      toast.add({ title: 'Exito', description: 'Plantilla actualizada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar plantilla', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteTemplate = async (id: number) => {
    try {
      await $fetch(`/api/inspections/templates/${id}`, { method: 'DELETE' })
      store.deleteTemplateInStore(id)
      toast.add({ title: 'Eliminado', description: 'Plantilla eliminada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar la plantilla', color: 'error' })
      return false
    }
  }

  return {
    templates,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}
