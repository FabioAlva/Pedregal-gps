import type { InventoryPart, NewInventoryPart } from '#shared/types/db'

export interface IInventoryPartRepository {
  getAll(): Promise<InventoryPart[]>
  create(data: NewInventoryPart): Promise<number>
  update(id: number, data: Partial<NewInventoryPart>): Promise<void>
  delete(id: number): Promise<void>
}
