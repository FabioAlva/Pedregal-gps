import { storeToRefs } from 'pinia'
import { useExpenseCategoryStore } from '../stores/useExpenseCategoryStore'

interface ExpenseCategoryPayload {
  nombre: string
  esCombustible?: boolean
  activo?: boolean
  organizacionId?: number
}

export const useExpenseCategories = () => {
  const toast = useToast()
  const store = useExpenseCategoryStore()
  const { categories } = storeToRefs(store)

  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isUpdating = ref(false)

  const fetchCategories = async () => {
    isBootLoading.value = true
    try {
      await store.fetchCategories()
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudieron cargar categorias', color: 'error' })
    } finally {
      isBootLoading.value = false
    }
  }

  const createCategory = async (payload: ExpenseCategoryPayload) => {
    isSaving.value = true
    try {
      const res = await $fetch<any>('/api/expenses/categories', {
        method: 'POST',
        body: { ...payload, esCombustible: payload.esCombustible ?? false }
      })
      store.addCategory({ ...payload, esCombustible: payload.esCombustible ?? false, ...res } as any)
      toast.add({ title: 'Éxito', description: 'Categoria creada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al crear categoria', color: 'error' })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const updateCategory = async (id: number, payload: Partial<ExpenseCategoryPayload>) => {
    isUpdating.value = true
    try {
      await $fetch(`/api/expenses/categories/${id}`, {
        method: 'PATCH',
        body: { ...payload, esCombustible: payload.esCombustible ?? false }
      })
      store.updateCategoryInStore({ ...payload, esCombustible: payload.esCombustible ?? false, id } as any)
      toast.add({ title: 'Éxito', description: 'Categoria actualizada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'Error al actualizar categoria', color: 'error' })
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await $fetch(`/api/expenses/categories/${id}`, { method: 'DELETE' })
      store.deleteCategoryInStore(id)
      toast.add({ title: 'Eliminado', description: 'Categoria eliminada', color: 'success' })
      return true
    } catch (e) {
      toast.add({ title: 'Error', description: 'No se pudo eliminar la categoria', color: 'error' })
      return false
    }
  }

  return {
    categories,
    isLoading: isBootLoading,
    isSaving,
    isUpdating,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
