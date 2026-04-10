import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Field } from '~~/shared/types/db'

export const useFieldStore = defineStore('gps-fields', () => {
  const fields = ref<Field[]>([])
  const lastFetchAt = ref(0)

  const markFetched = () => {
    lastFetchAt.value = Date.now()
  }

  const isCacheFresh = (ttlMs: number) => {
    if (!lastFetchAt.value) return false
    return Date.now() - lastFetchAt.value < ttlMs
  }

  return {
    fields,
    lastFetchAt,
    markFetched,
    isCacheFresh
  }
})
