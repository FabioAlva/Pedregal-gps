// repositories/FleetEquipment.repository.ts
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { IFleetEquipmentRepository } from './Interfaces/IEquipmentFleetRepository'
import type { NewFleetEquipment } from '#shared/types/db'

import { eq, and, inArray, isNull, sql } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export class NeonFleetEquipmentRepository implements IFleetEquipmentRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}



  


  /* Historico que ya saca la placa del auto , nombre del gps , etc */
  async getAssignments() {
    return await this.db
      .select({
        idAsignacion: schema.fleetEquipment.id,
        idGps: schema.equipment.codigo,
        nombreGps: schema.equipment.nombre,
        imei: sql<string>`${schema.equipment.especificaciones}->>'imei'`,
        placaAuto: schema.fleet.placa,
        fechaAsignacion: schema.fleetEquipment.instaladoEl,
        fechaRetiro: schema.fleetEquipment.retiradoEl
      })
      .from(schema.fleetEquipment)
      .innerJoin(schema.equipment, eq(schema.fleetEquipment.equipoId, schema.equipment.id))
      .innerJoin(schema.fleet, eq(schema.fleetEquipment.flotaId, schema.fleet.id))
  }

  async getActiveAssignments() {
    return await this.db
      .select({
        idAsignacion: schema.fleetEquipment.id,
        idGps: schema.equipment.codigo,
        nombreGps: schema.equipment.nombre,
        imei: sql<string>`${schema.equipment.especificaciones}->>'imei'`,
        placaAuto: schema.fleet.placa,
        fechaAsignacion: schema.fleetEquipment.instaladoEl,
        fechaRetiro: schema.fleetEquipment.retiradoEl
      })
      .from(schema.fleetEquipment)
      .innerJoin(schema.equipment, eq(schema.fleetEquipment.equipoId, schema.equipment.id))
      .innerJoin(schema.fleet, eq(schema.fleetEquipment.flotaId, schema.fleet.id))
      .where(isNull(schema.fleetEquipment.retiradoEl))
  }

  async getActiveAssignmentsByGpsIds(gpsIds: string[]) {
    if (!gpsIds.length) return []

    return await this.db
      .select({
        idAsignacion: schema.fleetEquipment.id,
        idGps: schema.equipment.codigo,
        nombreGps: schema.equipment.nombre,
        imei: sql<string>`${schema.equipment.especificaciones}->>'imei'`,
        placaAuto: schema.fleet.placa,
        fechaAsignacion: schema.fleetEquipment.instaladoEl,
        fechaRetiro: schema.fleetEquipment.retiradoEl
      })
      .from(schema.fleetEquipment)
      .innerJoin(schema.equipment, eq(schema.fleetEquipment.equipoId, schema.equipment.id))
      .innerJoin(schema.fleet, eq(schema.fleetEquipment.flotaId, schema.fleet.id))
      .where(
        and(
          isNull(schema.fleetEquipment.retiradoEl),
          inArray(schema.equipment.codigo, gpsIds)
        )
      )
  }
async create(data: NewFleetEquipment): Promise<number> {
    // Usamos una transacción para asegurar integridad
    return await this.db.transaction(async (tx) => {
      // 1. Insertamos la asignación
      const [result] = await tx.insert(schema.fleetEquipment)
        .values(data)
        .returning({ id: schema.fleetEquipment.id })

      if (!result) throw new Error('Error al asignar el GPS')

      // 2. Actualizamos el estado del equipo a 'Instalado' (2) directamente
      await tx.update(schema.equipment)
        .set({ estadoId: 2, updatedAt: new Date() })
        .where(eq(schema.equipment.id, data.equipoId))

      return result.id
    })
  }

  async update(id: number, data: Partial<NewFleetEquipment>): Promise<void> {
    await this.db
      .update(schema.fleetEquipment)
      .set(data)
      .where(eq(schema.fleetEquipment.id, id))
  }

  /* Retorna solo placa , codigo del gps y el id de asignacion de la asignacion vigente*/

  async getActiveByGpsId(idGps: string) {
    const [result] = await this.db
      .select({
        idAsignacion: schema.fleetEquipment.id,
        idGps: schema.equipment.codigo,
        placaAuto: schema.fleet.placa,
      })
      .from(schema.fleetEquipment)
      .innerJoin(schema.equipment, eq(schema.fleetEquipment.equipoId, schema.equipment.id))
      .innerJoin(schema.fleet, eq(schema.fleetEquipment.flotaId, schema.fleet.id))
      .where(
        and(
          eq(schema.equipment.codigo, idGps),
          isNull(schema.fleetEquipment.retiradoEl)
        )
      )
      .limit(1);
    return result;
  }
}
