import type { Field, NewField } from '#shared/types/db'

export interface IFieldRepository {
  findAllActives(): Promise<Field[]>
  findById(id: number): Promise<Field | undefined>
  create(field: NewField): Promise<number>
  update(id: number, data: Partial<NewField>): Promise<void>
  delete(id: number): Promise<void>
}
