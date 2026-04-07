import { storeToRefs } from 'pinia'
import { useMaintenanceScheduleStore } from '../stores/useMaintenanceScheduleStore'

interface SchedulePayload {
  flotaId: number
  nombre: string
  descripcion?: string | null
  intervaloKm?: number | null
  intervaloHoras?: number | null
  intervaloDias?: number | null
  ultimoKm?: number | null
  ultimasHoras?: number | null
  ultimaFecha?: string | null
  proximaFecha?: string | null
  proximoKm?: number | null
  proximasHoras?: number | null
  activo?: boolean
}

export const useMaintenanceSchedules = () => {
  const toast = useToast()
  const store = useMaintenanceScheduleStore()
  const { schedules } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchSchedules = async (force = false) => {
    isBootLoading.value = true
    try {
      await store.fetchSchedules(force)
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar los mantenimientos', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createSchedule = async (payload: SchedulePayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/pm/schedules', {
        method: 'POST',
        body: payload
      })
      store.addSchedule({ ...payload, ...res } as any)
      toast.add({ title: 'Exito', description: 'Mantenimiento programado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al crear mantenimiento', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateSchedule = async (id: number, payload: Partial<SchedulePayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/pm/schedules/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updateScheduleInStore({ ...payload, id } as any)
      toast.add({ title: 'Exito', description: 'Mantenimiento actualizado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar mantenimiento', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteSchedule = async (id: number) => {
    try {
      await $fetch(`/api/pm/schedules/${id}`, { method: 'DELETE' })
      store.deleteScheduleInStore(id)
      toast.add({ title: 'Eliminado', description: 'Mantenimiento eliminado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar el mantenimiento', color: 'error' })
      return false
    }
  }

  return {
    schedules,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
}
