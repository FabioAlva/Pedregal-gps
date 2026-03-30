import { storeToRefs } from 'pinia'
import { useTeamFeetStore } from '../stores/useTeamFeetStore'
import type { Assignment, EquipmentApiItem, FleetApiItem, Gps } from '../../../gps/app/types/ITeemFleet'

export function useTeamFleet() {
  const toast = useToast()
  const store = useTeamFeetStore()
  const { 
    listGps, 
    listAssignments, 
    listActiveAssignments, 
    listFleets,
    availableGps,
    isLoadingGps,
    isLoadingAssignments,
    isLoadingFleets 
  } = storeToRefs(store)

  // 1. Fetch GPS
  const fetchGps = async (force = false) => {
    if (listGps.value.length > 0 && !force) return
    isLoadingGps.value = true
    try {
      const data = await $fetch<EquipmentApiItem[]>('/api/equipment')
      store.setGps(data.map(d => ({
        id: d.id,
        name: d.nombre,
        value: d.codigo,
        urlMqtt: d.especificaciones?.topic || '',
        state: d.estadoId,
        imei: d.codigo,
        topic: d.especificaciones?.topic || '',
        color: d.especificaciones?.color || '#3b82f6'
      })))
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se cargaron los equipos', color: 'error' })
    } finally {
      isLoadingGps.value = false
    }
  }

  // 2. Fetch Fleets Available
  const fetchFleets = async (includePlate?: string, force = false) => {
    if (listFleets.value.length > 0 && !force && !includePlate) return
    isLoadingFleets.value = true
    try {
      const data = await $fetch<FleetApiItem[]>('/api/fleets/available', {
        query: includePlate ? { includePlate } : undefined
      })
      store.setFleets(data)
    } finally {
      isLoadingFleets.value = false
    }
  }

  // 3. Fetch Active Assignments
  const fetchAssignments = async (force = false) => {
    if (listAssignments.value.length > 0 && !force) return
    isLoadingAssignments.value = true
    try {
      const data = await $fetch<Assignment[]>('/api/equipmentFeet')
      store.setAssignments(data)
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al cargar historial', color: 'error' })
    } finally {
      isLoadingAssignments.value = false
    }
  }

  // 4. Fetch Asignaciones ACTIVAS 
  const fetchActiveAssignments = async (force = false) => {
    if (listActiveAssignments.value.length > 0 && !force) return
    isLoadingAssignments.value = true
    try {
      const data = await $fetch<Assignment[]>('/api/equipmentFeet/active')
      store.setActiveAssignments(data)
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al cargar asignaciones', color: 'error' })
    } finally {
      isLoadingAssignments.value = false
    }
  }

  // 4. Transformación para Filtros (UI)
  const getFilterDevicesFromStore = (): Gps[] => {
    return listActiveAssignments.value.map((asig) => {
      const gps = listGps.value.find(g => g.value === asig.idGps)
      return {
        id: asig.idAsignacion,
        name: asig.placaAuto,
        label: asig.placaAuto,
        value: asig.idGps,
        urlMqtt: gps?.urlMqtt || '',
        color: gps?.color || '#3b82f6',
        state: gps?.state || 2,
        imei: asig.imei
      }
    })
  }

  // 5. Carga coordinada para Filtros
  const fetchFilterDevicesSource = async (force = false) => {
    await Promise.all([fetchGps(force), fetchActiveAssignments(force)])
    return getFilterDevicesFromStore()
  }

  // 6. Guardar Asignación
  const saveAssignment = async (payload: { flotaId: number, equipoId: number }) => {
    try {
      await $fetch('/api/equipmentFeet', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Éxito', description: 'Asignación creada', color: 'success' })
      store.resetStore() // Limpiamos para forzar recarga de datos frescos
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al asignar', color: 'error' })
      return false
    }
  }

  return {
    listGps,
    availableGps,
    listAssignments,
    listActiveAssignments,
    listFleets,
    isLoadingGps,
    isLoadingAssignments,
    isLoadingFleets,
    fetchGps,
    fetchFleets,
    fetchAssignments,
    fetchActiveAssignments,
    fetchFilterDevicesSource,
    saveAssignment,
    resetTeamFeetData: store.resetStore
  }
}