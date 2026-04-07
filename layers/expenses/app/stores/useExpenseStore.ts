import { defineStore } from 'pinia'
import type { FleetExpense } from '~~/shared/types/db'

export const useExpenseStore = defineStore('expenses', () => {
  const expenses = ref<FleetExpense[]>([])
  const isLoading = ref(false)

  const fetchExpenses = async () => {
    if (expenses.value.length > 0) return
    isLoading.value = true
    try {
      expenses.value = await $fetch<FleetExpense[]>('/api/expenses')
    } finally {
      isLoading.value = false
    }
  }

  const addExpense = (newExpense: FleetExpense) => {
    expenses.value = [newExpense, ...expenses.value]
  }

  const updateExpenseInStore = (updatedExpense: FleetExpense) => {
    const index = expenses.value.findIndex(e => e.id === updatedExpense.id)
    if (index !== -1) {
      const next = [...expenses.value]
      next[index] = updatedExpense
      expenses.value = next
    }
  }

  const deleteExpenseInStore = (id: number) => {
    expenses.value = expenses.value.filter(e => e.id !== id)
  }

  const resetCache = () => { expenses.value = [] }

  return {
    expenses,
    isLoading,
    fetchExpenses,
    addExpense,
    updateExpenseInStore,
    deleteExpenseInStore,
    resetCache
  }
})
