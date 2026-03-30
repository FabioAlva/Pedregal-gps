import type { NeonHttpDatabase } from 'drizzle-orm/neon-http/driver'
import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { NeonFleetEquipmentRepository } from '~~/layers/fleet-management/server/Repository/NeonFleetEquipmentRepository'
import { sendAlertEmail } from '../../utils/mailer'
import { SpeedAlertInfo } from '../../schemas/ISpeedAlertInfo'

export class AlertService {
  private fleetEquipmentRepo: NeonFleetEquipmentRepository

  constructor(private db: NeonHttpDatabase<typeof schema>) {
    this.fleetEquipmentRepo = new NeonFleetEquipmentRepository(db)
  }

  async checkAndLogSpeed(deviceId: string, speed: number, lat: number, lng: number) {
    try {

      const [alerta] = await this.db.select().from(schema.gpsAlerts)
        .where(and(eq(schema.gpsAlerts.descripcion, 'LimiteVelocidad'), eq(schema.gpsAlerts.activo, true)))
        .limit(1);

      if (!alerta || speed <= alerta.limiteValor) return { status: 200, message: 'No alert triggered' };

      const AssignedActive = await this.fleetEquipmentRepo.getActiveByGpsId(deviceId);

      if (!AssignedActive) return { status: 404, message: 'Active device assignment not found' };
      
      await this.db.insert(schema.gpsAlertLogs).values({
        alertaId: alerta.id,
        fleetEquipmentId: AssignedActive.idAsignacion,
        valorRegistrado: speed,
        limiteVigente: alerta.limiteValor,
        lat, lng
      });

      const info:SpeedAlertInfo = { deviceId, placa: AssignedActive.placaAuto, speed, lat, lng, time: Date.now() };

      await sendAlertEmail(info);

     return { status: 201 as const, data: info as SpeedAlertInfo };

    } catch (error: any) {
      console.error('AlertService Error:', error);
      return { status: 500, message: error.message || 'Internal Server Error' };
    }
  }
}