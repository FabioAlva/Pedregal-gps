import * as schema from '~~/server/db/schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { IFleetRepository } from './Interfaces/IFleetRepository'
import { eq, isNull, notInArray, or } from 'drizzle-orm'

export class NeonFleetRepository implements IFleetRepository{
  constructor(private db: NeonHttpDatabase<typeof schema>) {}

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
}
