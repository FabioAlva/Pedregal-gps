import { defineStore } from 'pinia'
import type { InspectionTemplate } from '#shared/types/db'

export const useInspectionTemplateStore = defineStore('inspectionTemplates', () => {
  const templates = ref<InspectionTemplate[]>([])
  const isLoading = ref(false)

  const fetchTemplates = async (force = false) => {
    if (!force && templates.value.length > 0) return
    isLoading.value = true
    try {
      templates.value = await $fetch<InspectionTemplate[]>('/api/inspections/templates')
    } finally {
      isLoading.value = false
    }
  }

  const addTemplate = (template: InspectionTemplate) => {
    templates.value = [template, ...templates.value]
  }

  const updateTemplateInStore = (template: InspectionTemplate) => {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index !== -1) {
      const next = [...templates.value]
      next[index] = template
      templates.value = next
    }
  }

  const deleteTemplateInStore = (id: number) => {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  const resetCache = () => { templates.value = [] }

  return {
    templates,
    isLoading,
    fetchTemplates,
    addTemplate,
    updateTemplateInStore,
    deleteTemplateInStore,
    resetCache
  }
})
