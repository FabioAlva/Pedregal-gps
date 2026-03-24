import type { NewRole, Role } from '~~/shared/types/db'

export interface IRoleRepository {
  findAll(): Promise<Role[]>
  findById(id: number): Promise<Role | undefined>
  create(data: NewRole): Promise<number>
  update(id: number, data: Partial<NewRole>): Promise<void>
  delete(id: number): Promise<void>
}
