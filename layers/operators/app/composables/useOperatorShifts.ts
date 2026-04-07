export interface OperatorShiftRow {
  id: number
  operadorId: number
  flotaId: number
  operadorNombres: string
  operadorApellidos: string
  placa: string
  fechaInicio: string
  fechaFin: string | null
}

interface ShiftPayload {
  operadorId: number
  flotaId: number
  fechaInicio: string
  fechaFin: string
}

export const useOperatorShifts = () => {
  const shifts = ref<OperatorShiftRow[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  const fetchShifts = async () => {
    isLoading.value = true
    try {
      shifts.value = await $fetch<OperatorShiftRow[]>('/api/operators/shifts')
    } finally {
      isLoading.value = false
    }
  }

  const createShift = async (payload: ShiftPayload) => {
    isSaving.value = true
    try {
      await $fetch('/api/operators/shifts', { method: 'POST', body: payload })
      await fetchShifts()
      return true
    } finally {
      isSaving.value = false
    }
  }

  const updateShift = async (id: number, payload: Partial<ShiftPayload>) => {
    isSaving.value = true
    try {
      await $fetch(`/api/operators/shifts/${id}`, { method: 'PATCH', body: payload })
      await fetchShifts()
      return true
    } finally {
      isSaving.value = false
    }
  }

  return {
    shifts,
    isLoading,
    isSaving,
    fetchShifts,
    createShift,
    updateShift
  }
}
