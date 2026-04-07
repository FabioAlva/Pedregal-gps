import { desc, eq } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '~~/server/db/schema'
import type { IOperatorShiftRepository, OperatorShiftRow } from './Interfaces/IOperatorShiftRepository'

export class NeonOperatorShiftRepository implements IOperatorShiftRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAll(): Promise<OperatorShiftRow[]> {
    return await this.db
      .select({
        id: schema.fleetAssignments.id,
        operadorId: schema.fleetAssignments.operadorId,
        flotaId: schema.fleetAssignments.flotaId,
        fechaInicio: schema.fleetAssignments.fechaInicio,
        fechaFin: schema.fleetAssignments.fechaFin,
        operadorNombres: schema.operators.nombres,
        operadorApellidos: schema.operators.apellidos,
        placa: schema.fleet.placa
      })
      .from(schema.fleetAssignments)
      .innerJoin(schema.operators, eq(schema.fleetAssignments.operadorId, schema.operators.id))
      .innerJoin(schema.fleet, eq(schema.fleetAssignments.flotaId, schema.fleet.id))
      .orderBy(desc(schema.fleetAssignments.fechaInicio))
  }

  async create(data: { operadorId: number; flotaId: number; fechaInicio: Date; fechaFin: Date }): Promise<number> {
    const [result] = await this.db
      .insert(schema.fleetAssignments)
      .values({
        operadorId: data.operadorId,
        flotaId: data.flotaId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin
      })
      .returning({ id: schema.fleetAssignments.id })

    if (!result?.id) throw new Error('Error al crear el turno')
    return result.id
  }

  async update(id: number, data: { operadorId?: number; flotaId?: number; fechaInicio?: Date; fechaFin?: Date | null }): Promise<void> {
    await this.db.update(schema.fleetAssignments)
      .set(data)
      .where(eq(schema.fleetAssignments.id, id))
  }
}
