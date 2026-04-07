import * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { IFleetRepository } from './Interfaces/IFleetRepository'
import { and, eq, gt, isNull, notInArray, or } from 'drizzle-orm'

export class NeonFleetRepository implements IFleetRepository{
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

    async getAll() {
      const now = new Date()
      const rows = await this.db
        .select({
          fleet: schema.fleet,
          operadorId: schema.operators.id,
          operadorNombres: schema.operators.nombres,
          operadorApellidos: schema.operators.apellidos,
          assignmentFechaInicio: schema.fleetAssignments.fechaInicio
        })
        .from(schema.fleet)
        .leftJoin(
          schema.fleetAssignments,
          and(
            eq(schema.fleetAssignments.flotaId, schema.fleet.id),
            or(isNull(schema.fleetAssignments.fechaFin), gt(schema.fleetAssignments.fechaFin, now))
          )
        )
        .leftJoin(schema.operators, eq(schema.fleetAssignments.operadorId, schema.operators.id))

      const byFleet = new Map<number, {
        fleet: typeof schema.fleet.$inferSelect
        operadorId: number | null
        operadorNombres: string | null
        operadorApellidos: string | null
        fechaInicio: Date | null
      }>()

      for (const row of rows) {
        const current = byFleet.get(row.fleet.id)
        const fechaInicio = row.assignmentFechaInicio ?? null

        if (!current || (fechaInicio && (!current.fechaInicio || fechaInicio > current.fechaInicio))) {
          byFleet.set(row.fleet.id, {
            fleet: row.fleet,
            operadorId: row.operadorId ?? null,
            operadorNombres: row.operadorNombres ?? null,
            operadorApellidos: row.operadorApellidos ?? null,
            fechaInicio
          })
        }
      }

      return Array.from(byFleet.values()).map(row => ({
        ...row.fleet,
        conductor: row.operadorId
          ? { id: row.operadorId, nombre: `${row.operadorNombres ?? ''} ${row.operadorApellidos ?? ''}`.trim() }
          : null
      }))
    }

  async getBasic() {
    return await this.db.select({
      id: schema.fleet.id,
      placa: schema.fleet.placa
    }).from(schema.fleet)
  }

  async getAvailable(includePlate?: string) {
    const activeFleetIds = this.db
      .select({ flotaId: schema.fleetEquipment.flotaId })
      .from(schema.fleetEquipment)
      .where(isNull(schema.fleetEquipment.retiradoEl))

    const availableCondition = notInArray(schema.fleet.id, activeFleetIds)

    return await this.db
      .select({
        id: schema.fleet.id,
        placa: schema.fleet.placa
      })
      .from(schema.fleet)
      .where(
        includePlate
          ? or(availableCondition, eq(schema.fleet.placa, includePlate))
          : availableCondition
      )
  }
  
  async getPlateById(id: number) {
    const [result] = await this.db
      .select({ placa: schema.fleet.placa })
      .from(schema.fleet)
      .where(eq(schema.fleet.id, id))
      .limit(1);

    return result?.placa;
  }
  
  async create(data: any) {
  const insertData = {
    marca: String(data.marca),
    modelo: String(data.modelo),
    placa: String(data.placa),
    anho: Number(data.anho),
    estado: data.estado || 'OPERATIVO',
    vencimientoSoat: data.vencimientoSoat ? new Date(data.vencimientoSoat) : new Date(),
    vencimientoTecnica: data.vencimientoTecnica ? new Date(data.vencimientoTecnica) : null,
    urlSoatPdf: data.urlSoatPdf || null,
    urlFotoUnidad: data.urlFotoUnidad || null,
    urlTarjetaPdf: data.urlTarjetaPdf || null,
    urlTecnicaPdf: data.urlTecnicaPdf || null,
  }

  const [result] = await this.db.insert(schema.fleet)
    .values(insertData as any) // Usamos 'as any' para evitar peleas con el motor de inferencia de Drizzle
    .returning({ id: schema.fleet.id })

  // 3. Arreglamos el error de 'possibly undefined'
  if (!result || !result.id) {
    throw new Error('Error al crear la flota: No se retornó un ID válido')
  }

  return result.id
}

async update(id: number, data: any) {
    const { id: _, createdAt, ...updateData } = data 
    if (updateData.vencimientoSoat) updateData.vencimientoSoat = new Date(updateData.vencimientoSoat)
    if (updateData.vencimientoTecnica) updateData.vencimientoTecnica = new Date(updateData.vencimientoTecnica)
    await this.db.update(schema.fleet)
      .set({ 
        ...updateData, 
        updatedAt: new Date() 
      })
      .where(eq(schema.fleet.id, id))
  }

  async delete(id: number) {
    await this.db.delete(schema.fleet)
      .where(eq(schema.fleet.id, id))
  }

  async findById(id: number) {
    return await this.db.query.fleet.findFirst({
      where: eq(schema.fleet.id, id)
    })
  }
}
