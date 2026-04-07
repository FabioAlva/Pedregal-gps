import type { InspectionTemplate, NewInspectionTemplate } from '#shared/types/db'

export interface IInspectionTemplateRepository {
  getAll(): Promise<InspectionTemplate[]>
  create(data: NewInspectionTemplate): Promise<number>
  update(id: number, data: Partial<NewInspectionTemplate>): Promise<void>
  delete(id: number): Promise<void>
}
