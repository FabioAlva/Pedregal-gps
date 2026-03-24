import { and, eq, gt } from 'drizzle-orm'
import type { DbClient } from '~~/shared/types/db'
import { moduleRoutes, roleRoutePermissions, roles, session, userRoles } from '~~/server/db/schema'
import type {
  IPermissionRepository,
  PermissionPayload,
  RoutePermissionMap
} from './Interfaces/IPermissionRepository'

const EMPTY_PERMISSION = {
  ver: false,
  agregar: false,
  editar: false,
  eliminar: false
}

export class NeonPermissionRepository implements IPermissionRepository {
  constructor(private db: DbClient) {}

  async getAuthenticatedUserIdBySessionToken(token: string): Promise<string | undefined> {
    const [activeSession] = await this.db
      .select({ userId: session.userId })
      .from(session)
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
      .limit(1)

    return activeSession?.userId
  }

  async getUserPermissions(userId: string): Promise<PermissionPayload> {
    const routeRows = await this.db
      .select({
        rutaModuloId: roleRoutePermissions.rutaModuloId,
        ver: roleRoutePermissions.ver,
        agregar: roleRoutePermissions.agregar,
        editar: roleRoutePermissions.editar,
        eliminar: roleRoutePermissions.eliminar
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.rolId, roles.id))
      .innerJoin(roleRoutePermissions, eq(userRoles.rolId, roleRoutePermissions.rolId))
      .where(and(eq(userRoles.userId, userId), eq(roles.activo, true)))

    const routeMap: RoutePermissionMap = {}

    for (const row of routeRows) {
      const current = routeMap[row.rutaModuloId] ?? { ...EMPTY_PERMISSION }
      current.ver = current.ver || row.ver
      current.agregar = current.agregar || row.agregar
      current.editar = current.editar || row.editar
      current.eliminar = current.eliminar || row.eliminar
      routeMap[row.rutaModuloId] = current
    }

    return {
      routes: routeMap
    }
  }
}
