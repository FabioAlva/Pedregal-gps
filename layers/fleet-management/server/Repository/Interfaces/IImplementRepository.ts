import type { Implement, NewImplement } from '#shared/types/db'

export interface IImplementRepository {
  getAll(): Promise<Implement[]>
  findById(id: number): Promise<Implement | undefined>
  create(data: NewImplement): Promise<number>
  update(id: number, data: Partial<NewImplement>): Promise<void>
  delete(id: number): Promise<void>
}
