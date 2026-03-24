import type { NeonFleetRepository } from '../../Repository/NeonFleetRepository'

export class FleetService {
  constructor(private repo: NeonFleetRepository) {}
/* Cambiar este nombre a uno más descriptivo */
  async getBasicFleets() {
    return await this.repo.getBasic()
  }

  async getAvailableFleets(includePlate?: string) {
    return await this.repo.getAvailable(includePlate)
  }
}
