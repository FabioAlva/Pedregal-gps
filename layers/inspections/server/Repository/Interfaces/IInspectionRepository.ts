import type { Inspection, NewInspection } from '#shared/types/db'

export interface InspectionIssueInput {
  campoId: string
  descripcion: string
  severidad: 'LEVE' | 'MODERADO' | 'CRITICO'
  fotosUrl?: string[]
  resuelto?: boolean
}

export interface InspectionSummaryRow extends Inspection {
  flotaPlaca?: string | null
  operadorNombres?: string | null
  operadorApellidos?: string | null
  plantillaNombre?: string | null
}

export interface InspectionDetailRow extends InspectionSummaryRow {
  issues?: Array<InspectionIssueInput & { id: number; inspeccionId: number; createdAt: string | Date }>
}

export interface IInspectionRepository {
  getAll(): Promise<InspectionSummaryRow[]>
  getById(id: number): Promise<InspectionDetailRow | undefined>
  create(data: NewInspection, issues?: InspectionIssueInput[]): Promise<number>
}
