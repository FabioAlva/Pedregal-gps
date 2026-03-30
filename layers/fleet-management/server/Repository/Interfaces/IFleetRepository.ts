export interface IFleetRepository {
  getBasic(): Promise<{ id: number; placa: string }[]>;
  getAvailable(includePlate?: string): Promise<{ id: number; placa: string }[]>;
  getPlateById(id: number): Promise<string | undefined>;
  create(data: any): Promise<number>;
  update(id: number, data: any): Promise<void>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<any>;
}