import type { Operator } from '#shared/types/db'

interface OperatorPayload {
  organizacionId?: number
  nombres: string
  apellidos: string
  dni?: string | null
  licencia?: string | null
  categoriaLicencia?: string | null
  vencimientoLicencia?: string | null
  telefono?: string | null
  fotoUrl?: string | null
  activo?: boolean
}

export const useOperators = () => {
  const operators = ref<Operator[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  const fetchOperators = async (includeInactive = false) => {
    isLoading.value = true
    try {
      const query = includeInactive ? '?includeInactive=1' : ''
      operators.value = await $fetch<Operator[]>(`/api/operators${query}`)
    } finally {
      isLoading.value = false
    }
  }

  const createOperator = async (payload: OperatorPayload) => {
    isSaving.value = true
    try {
      await $fetch('/api/operators', { method: 'POST', body: payload })
      await fetchOperators()
      return true
    } finally {
      isSaving.value = false
    }
  }

  const updateOperator = async (id: number, payload: Partial<OperatorPayload>) => {
    isSaving.value = true
    try {
      await $fetch(`/api/operators/${id}`, { method: 'PATCH', body: payload })
      await fetchOperators()
      return true
    } finally {
      isSaving.value = false
    }
  }

  const deactivateOperator = async (id: number) => {
    isSaving.value = true
    try {
      await $fetch(`/api/operators/${id}`, { method: 'DELETE' })
      await fetchOperators()
      return true
    } finally {
      isSaving.value = false
    }
  }

  return {
    operators,
    isLoading,
    isSaving,
    fetchOperators,
    createOperator,
    updateOperator,
    deactivateOperator
  }
}
