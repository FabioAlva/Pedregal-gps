import { defineStore } from 'pinia'
import type { Assignment, Gps, Fleet } from '../../../gps/app/types/ITeemFleet'

export const useTeamFeetStore = defineStore('teamFleet', () => {
  const listGps = ref<Gps[]>([])
  const listAssignments = ref<Assignment[]>([])
  const listActiveAssignments = ref<Assignment[]>([])
  const listFleets = ref<Fleet[]>([])
  
  const isLoadingGps = ref(false)
  const isLoadingAssignments = ref(false)
  const isLoadingFleets = ref(false)

  // Getters
  const availableGps = computed(() => listGps.value.filter(g => g.state === 1))

  // Actions - Mutaciones del estado
  const setGps = (data: Gps[]) => { listGps.value = data }
  const setAssignments = (data: Assignment[]) => { listAssignments.value = data }
  const setActiveAssignments = (data: Assignment[]) => { listActiveAssignments.value = data }
  const setFleets = (data: Fleet[]) => { listFleets.value = data }

  const resetStore = () => {
    listGps.value = []
    listAssignments.value = []
    listActiveAssignments.value = []
    listFleets.value = []
  }

  return {
    listGps,
    listAssignments,
    listActiveAssignments,
    listFleets,
    isLoadingGps,
    isLoadingAssignments,
    isLoadingFleets,
    availableGps,
    setGps,
    setAssignments,
    setActiveAssignments,
    setFleets,
    resetStore
  }
})