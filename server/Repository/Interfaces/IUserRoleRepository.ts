import type { UserRole } from '~~/shared/types/db'

export interface IUserRoleWithRole {
  userId: string
  rolId: number
  rolNombre: string
  asignadoEl: Date
}

export interface IUserRoleRepository {
  findByUserId(userId: string): Promise<IUserRoleWithRole[]>
  replaceByUser(userId: string, roleIds: number[]): Promise<void>
  findRoleRowsByUserId(userId: string): Promise<UserRole[]>
}
