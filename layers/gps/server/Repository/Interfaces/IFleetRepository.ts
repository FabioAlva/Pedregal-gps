export interface IFleetRepository {
  getBasic(): Promise<{ id: number; placa: string }[]>;
  getAvailable(includePlate?: string): Promise<{ id: number; placa: string }[]>;
  getPlateById(id: number): Promise<string | undefined>; // Nuevo método
}