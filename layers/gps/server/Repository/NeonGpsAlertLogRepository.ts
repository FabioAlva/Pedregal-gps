import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { NewGpsAlertLog } from '#shared/types/db'
import type { IGpsAlertLogRepository } from './Interfaces/IGpsAlertLogRepository'

import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

export class NeonGpsAlertLogRepository implements IGpsAlertLogRepository {
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.query.gpsAlertLogs.findMany()
  }

  async findById(id: number) {
    return await this.db.query.gpsAlertLogs.findFirst({
      where: eq(schema.gpsAlertLogs.id, id)
    })
  }

  async findByAlertId(alertaId: number) {
    return await this.db.query.gpsAlertLogs.findMany({
      where: eq(schema.gpsAlertLogs.alertaId, alertaId)
    })
  }

  async findByEquipmentId(fleetEquipmentId: number) {
    return await this.db.query.gpsAlertLogs.findMany({
      where: eq(schema.gpsAlertLogs.fleetEquipmentId, fleetEquipmentId)
    })
  }

  async create(data: NewGpsAlertLog) {
    const [result] = await this.db.insert(schema.gpsAlertLogs)
      .values(data)
      .returning({ id: schema.gpsAlertLogs.id })
    if (!result) throw new Error('Error al crear el log de alerta GPS')
    return result.id
  }
}