import { and, eq, asc, inArray } from 'drizzle-orm'
import type { DbClient, ModuleRoute } from '~~/shared/types/db'
import { moduleRoutes, frontendBackendRouteLinks } from '~~/server/db/schema'
import type { 
  IModuleRouteRepository, 
  ModuleRouteInput, 
  ModuleRouteView 
} from './Interfaces/IModuleRouteRepository'

function toInternalRouteKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'route.general'
}

export class NeonModuleRouteRepository implements IModuleRouteRepository {
  constructor(private db: DbClient) {}

  async findAll(): Promise<ModuleRouteView[]> {
    return await this.db
      .select()
      .from(moduleRoutes)
      .orderBy(asc(moduleRoutes.url), asc(moduleRoutes.id))
  }

  async findById(id: number): Promise<ModuleRoute | undefined> {
    return await this.db.query.moduleRoutes.findFirst({
      where: eq(moduleRoutes.id, id)
    })
  }

  async create(data: ModuleRouteInput): Promise<number> {
    const [created] = await this.db
      .insert(moduleRoutes)
      .values({
        ...data,
        capacidadClave: toInternalRouteKey(data.url)
      })
      .returning({ id: moduleRoutes.id })

    if (!created) throw new Error('No se pudo crear la ruta')
    return created.id
  }

  async update(id: number, data: ModuleRouteInput): Promise<void> {
    await this.db
      .update(moduleRoutes)
      .set({
        ...data,
        capacidadClave: toInternalRouteKey(data.url)
      })
      .where(eq(moduleRoutes.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(moduleRoutes).where(eq(moduleRoutes.id, id))
  }


  async findProtectedBackendRoutes(): Promise<ModuleRouteView[]> {
    return await this.db
      .select()
      .from(moduleRoutes)
      .where(and(
        eq(moduleRoutes.tipoRuta, 'backend'), 
        eq(moduleRoutes.protegida, true)
      ))
      .orderBy(asc(moduleRoutes.id))
  }

  async getLinkedFrontendIds(backendId: number): Promise<number[]> {
    const rows = await this.db
      .select({ frontendRouteId: frontendBackendRouteLinks.frontendRouteId })
      .from(frontendBackendRouteLinks)
      .where(eq(frontendBackendRouteLinks.backendRouteId, backendId))

    return Array.from(new Set(rows.map(row => row.frontendRouteId)))
  }

  async replaceFrontendLinks(backendId: number, frontendIds: number[]): Promise<void> {
  await this.db.transaction(async (tx) => {
    // 1. Limpiamos relaciones actuales
    await tx.delete(frontendBackendRouteLinks)
      .where(eq(frontendBackendRouteLinks.backendRouteId, backendId));

    if (frontendIds.length === 0) return;

    // 2. Insertamos las nuevas
    await tx.insert(frontendBackendRouteLinks).values(
      frontendIds.map(fId => ({
        backendRouteId: backendId,
        frontendRouteId: fId
      }))
    );
  });
}

async validateRoutesExist(ids: number[], expectedType: 'frontend' | 'backend'): Promise<void> {
  if (ids.length === 0) return

  const existing = await this.db.query.moduleRoutes.findMany({
    where: and(
      inArray(moduleRoutes.id, ids),
      eq(moduleRoutes.tipoRuta, expectedType),
      eq(moduleRoutes.protegida, true)
    )
  })

  if (existing.length !== ids.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Una o más rutas no existen, no son de tipo ${expectedType} o no están protegidas`
    })
  }
}

async syncRelatedLinks(routeId: number, relatedIds: number[], isBackend: boolean): Promise<void> {
  await this.db.transaction(async (tx) => {
    // 1. Borramos relaciones previas en la dirección correcta
    const condition = isBackend 
      ? eq(frontendBackendRouteLinks.backendRouteId, routeId)
      : eq(frontendBackendRouteLinks.frontendRouteId, routeId)
      
    await tx.delete(frontendBackendRouteLinks).where(condition)

    if (relatedIds.length === 0) return

    // 2. Insertamos las nuevas relaciones mapeando columnas dinámicamente
    await tx.insert(frontendBackendRouteLinks).values(
      relatedIds.map(relId => ({
        backendRouteId: isBackend ? routeId : relId,
        frontendRouteId: isBackend ? relId : routeId
      }))
    )
  })
}



async getLinkedBackendIds(frontendId: number): Promise<number[]> {
  const rows = await this.db
    .select({ backendId: frontendBackendRouteLinks.backendRouteId })
    .from(frontendBackendRouteLinks)
    .where(eq(frontendBackendRouteLinks.frontendRouteId, frontendId))

  return rows.map(r => r.backendId)
}
}