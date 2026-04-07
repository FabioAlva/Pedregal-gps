import { defineStore } from 'pinia'

export interface InspectionSummary {
  id: number
  createdAt: string | Date
  estado: 'APROBADO' | 'OBSERVADO' | 'CRITICO'
  tipo: 'PRE_USO' | 'POST_USO' | 'PERIODICA'
  flotaId: number
  operadorId: number | null
  plantillaId: number | null
  observaciones?: string | null
  flotaPlaca?: string | null
  operadorNombres?: string | null
  operadorApellidos?: string | null
  plantillaNombre?: string | null
}

export interface InspectionDetail extends InspectionSummary {
  esquemaSnapshot?: any
  respuestas?: Record<string, any>
  firmaUrl?: string | null
  issues?: Array<{
    id: number
    inspeccionId: number
    campoId: string
    descripcion: string
    severidad: 'LEVE' | 'MODERADO' | 'CRITICO'
    fotosUrl?: string[]
    resuelto: boolean
    createdAt: string | Date
  }>
}

export const useInspectionStore = defineStore('inspections', () => {
  const inspections = ref<InspectionSummary[]>([])
  const details = ref<Record<number, InspectionDetail>>({})
  const isLoading = ref(false)

  const fetchInspections = async (force = false) => {
    if (!force && inspections.value.length > 0) return
    isLoading.value = true
    try {
      inspections.value = await $fetch<InspectionSummary[]>('/api/inspections')
    } finally {
      isLoading.value = false
    }
  }

  const fetchInspectionDetail = async (id: number) => {
    const existing = details.value[id]
    if (existing) return existing
    const detail = await $fetch<InspectionDetail>(`/api/inspections/${id}`)
    details.value = { ...details.value, [id]: detail }
    return detail
  }

  const addInspection = (inspection: InspectionSummary) => {
    inspections.value = [inspection, ...inspections.value]
  }

  const resetCache = () => {
    inspections.value = []
    details.value = {}
  }

  return {
    inspections,
    details,
    isLoading,
    fetchInspections,
    fetchInspectionDetail,
    addInspection,
    resetCache
  }
})
