import type { Operator, NewOperator } from '#shared/types/db'

export interface IOperatorRepository {
  findAll(includeInactive?: boolean): Promise<Operator[]>
  findById(id: number): Promise<Operator | undefined>
  create(data: NewOperator): Promise<number>
  update(id: number, data: Partial<NewOperator>): Promise<void>
  deactivate(id: number): Promise<void>
}
