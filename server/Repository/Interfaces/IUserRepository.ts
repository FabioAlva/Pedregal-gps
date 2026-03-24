import type { User } from '~~/shared/types/db'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | undefined>
  update(id: string, data: { name: string; email: string }): Promise<void>
}
