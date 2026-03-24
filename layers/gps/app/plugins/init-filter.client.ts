import { defineNuxtPlugin } from 'nuxt/app'
import { useFilterStore } from '../stores/useFilterStore'

export default defineNuxtPlugin(() => {
  const store = useFilterStore()
  store.initDates()
})
