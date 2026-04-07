import { defineStore } from 'pinia'
import type { MaintenanceSchedule } from '#shared/types/db'

export const useMaintenanceScheduleStore = defineStore('maintenanceSchedules', () => {
  const schedules = ref<MaintenanceSchedule[]>([])
  const isLoading = ref(false)

  const fetchSchedules = async (force = false) => {
    if (!force && schedules.value.length > 0) return
    isLoading.value = true
    try {
      schedules.value = await $fetch<MaintenanceSchedule[]>('/api/pm/schedules')
    } finally {
      isLoading.value = false
    }
  }

  const addSchedule = (schedule: MaintenanceSchedule) => {
    schedules.value = [schedule, ...schedules.value]
  }

  const updateScheduleInStore = (schedule: MaintenanceSchedule) => {
    const index = schedules.value.findIndex(item => item.id === schedule.id)
    if (index !== -1) {
      const next = [...schedules.value]
      next[index] = schedule
      schedules.value = next
    }
  }

  const deleteScheduleInStore = (id: number) => {
    schedules.value = schedules.value.filter(item => item.id !== id)
  }

  const resetCache = () => { schedules.value = [] }

  return {
    schedules,
    isLoading,
    fetchSchedules,
    addSchedule,
    updateScheduleInStore,
    deleteScheduleInStore,
    resetCache
  }
})
