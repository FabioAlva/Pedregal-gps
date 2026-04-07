import { defineStore } from 'pinia'
import type { ExpenseCategory } from '~~/shared/types/db'

export const useExpenseCategoryStore = defineStore('expenseCategories', () => {
  const categories = ref<ExpenseCategory[]>([])
  const isLoading = ref(false)

  const fetchCategories = async () => {
    if (categories.value.length > 0) return
    isLoading.value = true
    try {
      categories.value = await $fetch<ExpenseCategory[]>('/api/expenses/categories')
    } finally {
      isLoading.value = false
    }
  }

  const addCategory = (newCategory: ExpenseCategory) => {
    categories.value = [newCategory, ...categories.value]
  }

  const updateCategoryInStore = (updatedCategory: ExpenseCategory) => {
    const index = categories.value.findIndex(c => c.id === updatedCategory.id)
    if (index !== -1) {
      const next = [...categories.value]
      next[index] = updatedCategory
      categories.value = next
    }
  }

  const deleteCategoryInStore = (id: number) => {
    categories.value = categories.value.filter(c => c.id !== id)
  }

  const resetCache = () => { categories.value = [] }

  return {
    categories,
    isLoading,
    fetchCategories,
    addCategory,
    updateCategoryInStore,
    deleteCategoryInStore,
    resetCache
  }
})
