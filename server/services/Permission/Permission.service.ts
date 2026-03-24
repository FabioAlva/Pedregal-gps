import { db } from '@nuxthub/db'
import { NeonPermissionRepository } from '~~/server/Repository/NeonPermissionRepository'
import type { PermissionPayload } from '~~/server/Repository/Interfaces/IPermissionRepository'

export class PermissionService {
  private repo: NeonPermissionRepository

  constructor() {
    this.repo = new NeonPermissionRepository(db)
  }

  async getAuthenticatedUserIdBySessionToken(token: string): Promise<string | undefined> {
    return await this.repo.getAuthenticatedUserIdBySessionToken(token)
  }

  async getUserPermissions(userId: string): Promise<PermissionPayload> {
    return await this.repo.getUserPermissions(userId)
  }
}
