export interface OperatorShiftRow {
  id: number
  operadorId: number
  flotaId: number
  operadorNombres: string
  operadorApellidos: string
  placa: string
  fechaInicio: string
  fechaFin: string | null
}

export interface IOperatorShiftRepository {
  findAll(): Promise<OperatorShiftRow[]>
  create(data: { operadorId: number; flotaId: number; fechaInicio: Date; fechaFin: Date }): Promise<number>
  update(id: number, data: { operadorId?: number; flotaId?: number; fechaInicio?: Date; fechaFin?: Date | null }): Promise<void>
}
