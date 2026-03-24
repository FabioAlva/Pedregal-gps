import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Assignment, Gps, Fleet } from '../types/ITeemFleet'

export const useTeamFeetStore = defineStore('fleet', () => {
  type Resource = 'gps' | 'assignments' | 'activeAssignments' | 'fleets'

  const listGps = ref<Gps[]>([])
  const listAssignments = ref<Assignment[]>([])
  const listActiveAssignments = ref<Assignment[]>([])
  const listFleets = ref<Fleet[]>([])
  const isLoadingGps = ref(false)
  const isLoadingAssignments = ref(false)
  const isLoadingFleets = ref(false)
  const cacheMeta = ref<Record<Resource, { fetchedAt: number, queryKey: string }>>({
    gps: { fetchedAt: 0, queryKey: '' },
    assignments: { fetchedAt: 0, queryKey: '' },
    activeAssignments: { fetchedAt: 0, queryKey: '' },
    fleets: { fetchedAt: 0, queryKey: '' }
  })

  const availableGps = computed(() => listGps.value.filter(g => g.state === 1))

  const setResourceFetched = (resource: Resource, queryKey = '') => {
    cacheMeta.value[resource] = {
      fetchedAt: Date.now(),
      queryKey
    }
  }

  const isResourceCacheFresh = (resource: Resource, ttlMs: number, queryKey = '') => {
    const meta = cacheMeta.value[resource]
    if (!meta.fetchedAt) return false
    if (meta.queryKey !== queryKey) return false
    return Date.now() - meta.fetchedAt < ttlMs
  }

  const resetResource = (resource?: 'gps' | 'assignments' | 'fleets') => {
    if (!resource || resource === 'gps') {
      listGps.value = []
      cacheMeta.value.gps = { fetchedAt: 0, queryKey: '' }
    }
    if (!resource || resource === 'assignments') {
      listAssignments.value = []
      listActiveAssignments.value = []
      cacheMeta.value.assignments = { fetchedAt: 0, queryKey: '' }
      cacheMeta.value.activeAssignments = { fetchedAt: 0, queryKey: '' }
    }
    if (!resource || resource === 'fleets') {
      listFleets.value = []
      cacheMeta.value.fleets = { fetchedAt: 0, queryKey: '' }
    }
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
    cacheMeta,
    setResourceFetched,
    isResourceCacheFresh,
    resetResource
  }
})
