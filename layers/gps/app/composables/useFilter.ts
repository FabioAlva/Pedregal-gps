import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useFilterStore } from '../stores/useFilterStore'
import { useTeamFleet } from '#layers/fleet-management/app/composable/useTeamFeet'
import { getISODate } from '../utils/FormatTime'

type InvalidFilterValidation = {
  isValid: false
  message: string
}

type ValidFilterValidation = {
  isValid: true
  devices: string[]
  start: string
  end: string
}

export type FilterValidationResult = InvalidFilterValidation | ValidFilterValidation

export default function useFilter() {

  const store = useFilterStore()
  const { fetchFilterDevicesSource } = useTeamFleet()
  const { selectedDevice, startDate, endDate, listDevice } = storeToRefs(store)
  const isLoadingDevices = ref(false)
  
  const getDeviceIds = () => {
    if (selectedDevice.value === 'all') {
      return listDevice.value
        .filter(d => d.value && d.value !== 'all' && d.value !== 'undefined')
        .map(d => d.value)
    }
    if (!selectedDevice.value || selectedDevice.value === 'undefined') return []
    return [selectedDevice.value]
  }

  const validateFilters = (): FilterValidationResult => {
    const devices = getDeviceIds()
    const start = getISODate(startDate.value)
    const end = getISODate(endDate.value)

    if (!start || !end) {
      return { isValid: false, message: 'Debes seleccionar un rango de fechas para consultar.' }
    }

    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
      return { isValid: false, message: 'Formato de fecha invalido. Verifica el rango seleccionado.' }
    }

    if (startDateObj >= endDateObj) {
      return { isValid: false, message: 'Rango de fechas invalido: la fecha inicial debe ser menor a la final.' }
    }

    if (!devices.length) {
      return { isValid: false, message: 'Debes seleccionar al menos un dispositivo.' }
    }

    return { isValid: true, devices, start, end }
  }

  
  const fetchDevices = async (options?: { force?: boolean }) => {
    const force = options?.force === true

    isLoadingDevices.value = true
    try {
      const formatted = await fetchFilterDevicesSource()

      listDevice.value = [
        {
          id: 'all',
          value: 'all',
          label: 'Todos',
          name: 'Todos',
          urlMqtt: '',
          color: '',
          state: 0
        },
        ...formatted
      ]

      if (!listDevice.value.find(d => d.value === selectedDevice.value)) {
        selectedDevice.value = 'all'
      }
    } finally {
      isLoadingDevices.value = false
    }
  }

  const refreshDevices = async () => {
    await fetchDevices({ force: true })
  }

  
  const invalidateDevices = () => {
    store.invalidateDevices()
  }

  return {
    selectedDevice,
    listDevice,
    startDate,
    endDate,
    getDeviceIds,
    validateFilters,
    isLoadingDevices,
    fetchDevices,
    refreshDevices,
    invalidateDevices
  }
}
