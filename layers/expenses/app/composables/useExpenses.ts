import { storeToRefs } from 'pinia'
import type { ExpenseMetadata } from '~~/shared/types/db'
import { useExpenseStore } from '../stores/useExpenseStore'

interface ExpensePayload {
  flotaId: number
  categoriaId: number
  monto: number
  fecha?: string | null
  descripcion?: string | null
  operadorId?: number | null
  metadatos?: ExpenseMetadata
  comprobantesUrl?: string[]
}

export const useExpenses = () => {
  const toast = useToast()
  const store = useExpenseStore()
  const { expenses } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchExpenses = async () => {
    isBootLoading.value = true
    try {
      await store.fetchExpenses()
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar gastos', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createExpense = async (payload: ExpensePayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/expenses', {
        method: 'POST',
        body: payload
      })
      store.addExpense({ ...payload, ...res } as any)
      toast.add({ title: 'Éxito', description: 'Gasto registrado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al registrar gasto', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateExpense = async (id: number, payload: Partial<ExpensePayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        body: payload
      })
      store.updateExpenseInStore({ ...payload, id } as any)
      toast.add({ title: 'Éxito', description: 'Gasto actualizado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar gasto', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteExpense = async (id: number) => {
    try {
      await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      store.deleteExpenseInStore(id)
      toast.add({ title: 'Eliminado', description: 'Gasto eliminado', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar el gasto', color: 'error' })
      return false
    }
  }

  return {
    expenses,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
