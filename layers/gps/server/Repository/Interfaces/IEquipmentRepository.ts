import type { Equipment, NewEquipment } from '#shared/types/db'

export interface IEquipmentRepository {

  findAll(): Promise<Equipment[] | undefined>
  findById(id: number): Promise<Equipment | undefined>
  create(device: NewEquipment): Promise<number>
  updateState(id: number, state: number): Promise<void>

}
