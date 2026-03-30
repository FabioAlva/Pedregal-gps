import { useModuleStore } from '../stores/useModuleStore'
import { storeToRefs } from 'pinia'

export const useRoutesManager = () => {
  const toast = useToast()
  const moduleStore = useModuleStore()
  const selectedModuleRouteId = ref<number>()
  const relatedRouteIdsDraft = ref<Set<number>>(new Set())
  const isSavingNewRoute = ref(false)
  const isSavingRelated = ref(false)
  const isUpdatingRoute = ref(false)
  const loadRoutes = async () => {
    await moduleStore.fetchRoutes()
  }

  const loadRelatedRoutes = async (id: number) => {
    try {
      const res = await $fetch<{ relatedRouteIds: number[] }>(`/api/module-routes/${id}/related-routes`)
      relatedRouteIdsDraft.value = new Set(res.relatedRouteIds || [])
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se cargaron rutas relacionadas', color: 'error' })
    }
  }

  const saveRelatedRoutes = async () => {
    if (!selectedModuleRouteId.value) return
    isSavingRelated.value = true
    try {
      await $fetch(`/api/module-routes/${selectedModuleRouteId.value}/related-routes`, {
        method: 'PUT',
        body: { relatedRouteIds: Array.from(relatedRouteIdsDraft.value) }
      })
      toast.add({ title: 'Éxito', description: 'Rutas relacionadas guardadas', color: 'success' })
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo guardar', color: 'error' })
    } finally {
      isSavingRelated.value = false
    }
  }

const createRoute = async (formData: any) => {
  isSavingNewRoute.value = true
  try {
    const res = await $fetch<ModuleRoute>('/api/module-routes', {
      method: 'POST',
      body: formData
    })      
    const newRouteFull = { ...formData, ...res }
    moduleStore.addRoute(newRouteFull) 
    toast.add({ title: 'Éxito', description: 'Ruta creada correctamente', color: 'success' })
    return newRouteFull
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.statusMessage || 'No se pudo crear', color: 'error' })
  } finally {
    isSavingNewRoute.value = false
  }
}

const updateRoute = async (id: number, formData: any) => {
    isUpdatingRoute.value = true
    try {
      const res = await $fetch<ModuleRoute>(`/api/module-routes/${id}`, {
        method: 'PATCH',
        body: formData
      })
      const updatedRouteFull = { ...formData, ...res, id } 
      moduleStore.updateRouteInStore(updatedRouteFull)
      toast.add({ title: 'Éxito', description: 'Ruta actualizada', color: 'success' })
      return updatedRouteFull
    } catch (e: any) {
      toast.add({ title: 'Error', description: 'Fallo al actualizar', color: 'error' })
    } finally {
      isUpdatingRoute.value = false
    }
  }

  return { 
  moduleStore, 
  selectedModuleRouteId, 
  relatedRouteIdsDraft, 
  isSavingRelated, 
  isSavingNewRoute,
  isUpdatingRoute,
  loadRoutes, 
  loadRelatedRoutes, 
  saveRelatedRoutes,
  createRoute,
  updateRoute
  }
}