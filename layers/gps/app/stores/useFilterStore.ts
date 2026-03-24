import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Gps } from '../types/ITeemFleet'

export const useFilterStore = defineStore('filter', () => {

  /* Estados reactivos del filtro 
  - listDevice: Lista de (Asignaciones Activas gps-> Placa).
  - selectedDevice: Dispositivo seleccionado en el filtro (por defecto 'all').
  - startDate: Fecha de inicio para el filtro (inicialmente null).
  - endDate: Fecha de fin para el filtro (inicialmente null).
  */

  const listDevice = ref<Gps[]>([])
  const selectedDevice = ref<string>('all')
  const startDate = ref<Date | null>(null)
  const endDate = ref<Date | null>(null)

  /* Condicional para que la fecha se renderize en el cliente y no en el servidor */
  const initDates = () => {
    if (import.meta.client) {
      if (!startDate.value) {
        startDate.value = new Date(new Date().setHours(0, 0, 0, 0))
      }
      if (!endDate.value) {
        endDate.value = new Date(new Date().setHours(23, 59, 59, 999))
      }
    }
  }

  /* Invalida la lista de dispositivos y reinicia la selección */
  const invalidateDevices = () => {
    listDevice.value = []
    selectedDevice.value = 'all'
  }

  return {
    listDevice,
    selectedDevice,
    startDate,
    endDate,
    initDates,
    invalidateDevices
  }
})
