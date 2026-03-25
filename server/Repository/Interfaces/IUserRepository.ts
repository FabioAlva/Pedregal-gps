
export interface IUserRoleWithRole {
  userId: string
  rolId: number
  rolNombre: string
  asignadoEl: Date
}
export interface IUserRepository {
  // Datos básicos
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | undefined>
  update(id: string, data: { name: string; email: string }): Promise<void>
  
  // Roles del usuario (Antes en IUserRoleRepository)
  findUserRoles(userId: string): Promise<IUserRoleWithRole[]>
  setUserRoles(userId: string, roleIds: number[]): Promise<void>
}