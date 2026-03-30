import type { Equipment, NewEquipment } from '#shared/types/db'

export interface IEquipmentRepository {
  findAll(): Promise<Equipment[]>
  findById(id: number): Promise<Equipment | undefined>
  create(device: NewEquipment): Promise<number>
  update(id: number, data: Partial<NewEquipment>): Promise<void> // Agregamos el genérico
  updateState(id: number, state: number): Promise<void>          // El que falta
  delete(id: number): Promise<void>
}