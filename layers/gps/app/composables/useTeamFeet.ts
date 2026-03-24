import { useTeamFeetStore } from '../stores/useTeamFeetStore'
import type { Assignment, EquipmentApiItem, FleetApiItem, Gps } from '../types/ITeemFleet'
import { cacheMaxAgeFromPinia } from '../../server/utils/cache-max-age'
import { shouldUsePiniaCache } from './usePiniaCacheGuard'

const GPS_PINIA_TTL_MS = cacheMaxAgeFromPinia.equipmentList * 1000
const ASSIGNMENTS_PINIA_TTL_MS = cacheMaxAgeFromPinia.fleetAssignmentsAll * 1000
const ACTIVE_ASSIGNMENTS_PINIA_TTL_MS = cacheMaxAgeFromPinia.fleetAssignmentsActive * 1000
const FLEETS_PINIA_TTL_MS = cacheMaxAgeFromPinia.fleetsAvailable * 1000

/**
 * Composable de datos base para GPS/flota/asignaciones.
 */

export function UseTeemFleet() {

  /*Store donde se guarda listgps,listasignaciones ,etc */
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
 
  /*Obtiene la lista de gps , se usa en el filterComponent y la Page de asignaciones */
  const fetchGps = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? GPS_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: listGps.value.length > 0,
      isFresh: store.isResourceCacheFresh('gps', ttlMs)
    })) {
      return
    }

    isLoadingGps.value = true
    try {
      const data = await $fetch<EquipmentApiItem[]>('/api/equipament')
      listGps.value = data.map(d => ({
        id: d.id,
        name: d.nombre,
        value: d.codigo,
        urlMqtt: d.especificaciones?.topic || '',
        state: d.estadoId,
        imei: d.codigo,
        topic: d.especificaciones?.topic || '',
        color: d.especificaciones?.color || '#3b82f6'
      }))
      store.setResourceFetched('gps')
    } finally {
      isLoadingGps.value = false
    }
  }

  /* Obtiene la lista de flotas disponibles(Sin un gps asignado) */
  const fetchFleets = async (includePlate?: string, options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? FLEETS_PINIA_TTL_MS
    const queryKey = includePlate ?? ''

    if (shouldUsePiniaCache({
      force,
      hasData: listFleets.value.length > 0,
      isFresh: store.isResourceCacheFresh('fleets', ttlMs, queryKey)
    })) {
      return
    }

    isLoadingFleets.value = true
    try {
      const data = await $fetch<FleetApiItem[]>('/api/fleets/available', {
        query: includePlate ? { includePlate } : undefined
      })

      listFleets.value = data
      store.setResourceFetched('fleets', queryKey)
    } finally {
      isLoadingFleets.value = false
    }
  }
  /* Obtiene la lista de asignaciones */
  const fetchAssignments = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? ASSIGNMENTS_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: listAssignments.value.length > 0,
      isFresh: store.isResourceCacheFresh('assignments', ttlMs)
    })) {
      return
    }

    isLoadingAssignments.value = true
    try {
      listAssignments.value = await $fetch<Assignment[]>('/api/equipamentFeet')
      store.setResourceFetched('assignments')
    } finally {
      isLoadingAssignments.value = false
    }
  }

  /* Obtiene la lista de asignaciones activas*/
  const fetchActiveAssignments = async (options?: { force?: boolean, ttlMs?: number }) => {
    const force = options?.force === true
    const ttlMs = options?.ttlMs ?? ACTIVE_ASSIGNMENTS_PINIA_TTL_MS

    if (shouldUsePiniaCache({
      force,
      hasData: listActiveAssignments.value.length > 0,
      isFresh: store.isResourceCacheFresh('activeAssignments', ttlMs)
    })) {
      return
    }

    isLoadingAssignments.value = true
    try {
      listActiveAssignments.value = await $fetch<Assignment[]>('/api/equipamentFeet/active')
      store.setResourceFetched('activeAssignments')
    } finally {
      isLoadingAssignments.value = false
    }
  }

  /* Retorna del store lista de dispositivos para el filterComponent 
   a partir de las asignaciones activas y los gps disponibles */

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

  // Carga la lista de dispositivos para el filterComponent
  const fetchFilterDevicesSource = async (options?: { force?: boolean }) => {
    const force = options?.force === true
    await Promise.all([
      fetchGps({ force }),
      fetchActiveAssignments({ force })
    ])
    return getFilterDevicesFromStore()
  }

  // Función para guardar una nueva asignación de gps a flota, refresca el store para mantener datos actualizados
  const saveAssignment = async (payload: {
    flotaId: number
    equipoId: number
  }) => {
    await $fetch('/api/equipamentFeet', {
      method: 'POST',
      body: payload
    })
    store.resetResource('assignments')
    store.resetResource('gps')
    store.resetResource('fleets')
  }

 /*Función para resetear los datos de gps, asignaciones y flotas en el store, 
  opcionalmente por recurso específico */
  
  const resetTeamFeetData = (resource?: 'gps' | 'assignments' | 'fleets') => {
    store.resetResource(resource)
  }

  return {
    listGps,
    isloadingGps: isLoadingGps,
    fetchGps,
    availableGps,
    listAssignments,
    listActiveAssignments,
    isLoadingAssignments,
    fetchAssignments,
    fetchActiveAssignments,
    fetchFilterDevicesSource,
    saveAssignment,
    listFleets,
    fetchFleets,
    resetTeamFeetData
  }
}
