// services/FleetEquipment/FleetEquipment.service.ts
import type { NewFleetEquipment } from '~~/shared/types/db'
import type { IFleetEquipmentRepository } from '../../Repository/Interfaces/IEquipmentFleetRepository'
import type { IEquipmentRepository } from '../../Repository/Interfaces/IEquipmentRepository'

export class FleetEquipmentService {
  constructor(
    private readonly fleetRepo: IFleetEquipmentRepository,
    private readonly equipmentRepo?: IEquipmentRepository
  ) {}

  async createAssignment(data: NewFleetEquipment) {
    const assignmentId = await this.fleetRepo.create(data)

    if (assignmentId && data.equipoId && this.equipmentRepo != null) {
      await this.equipmentRepo.updateState(data.equipoId, 2)
    }

    return assignmentId
  }

  async getAllAssignments() {
    return await this.fleetRepo.getAssignments()
  }

  async getActiveAssignments() {
    return await this.fleetRepo.getActiveAssignments()
  }

  async updateAssignment(id: number, data: Partial<NewFleetEquipment>): Promise<void> {
    await this.fleetRepo.update(id, data)
  }

  async getActiveByGpsId(idGps: string) {
    return await this.fleetRepo.getActiveByGpsId(idGps)
  }
  
}
