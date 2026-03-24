import { asc, eq } from 'drizzle-orm'
import type { DbClient } from '~~/shared/types/db'
import { moduleRoutes } from '~~/server/db/schema'
import type { IModuleRouteRepository, ModuleRouteInput, ModuleRouteView } from './Interfaces/IModuleRouteRepository'

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
    const rows = await this.db
      .select({
        id: moduleRoutes.id,
        nombre: moduleRoutes.nombre,
        url: moduleRoutes.url,
        tipoRuta: moduleRoutes.tipoRuta,
        metodo: moduleRoutes.metodo,
        accionRequerida: moduleRoutes.accionRequerida,
        protegida: moduleRoutes.protegida
      })
      .from(moduleRoutes)
      .orderBy(asc(moduleRoutes.url), asc(moduleRoutes.id))

    return rows
  }

  async findById(id: number) {
    return await this.db.query.moduleRoutes.findFirst({
      where: eq(moduleRoutes.id, id)
    })
  }

  async create(data: ModuleRouteInput): Promise<number> {
    const [created] = await this.db
      .insert(moduleRoutes)
      .values({
        nombre: data.nombre,
        url: data.url,
        tipoRuta: data.tipoRuta,
        metodo: data.metodo,
        capacidadClave: toInternalRouteKey(data.url),
        accionRequerida: data.accionRequerida,
        protegida: data.protegida
      })
      .returning({ id: moduleRoutes.id })

    if (!created) throw new Error('No se pudo crear la ruta de modulo')
    return created.id
  }

  async update(id: number, data: ModuleRouteInput): Promise<void> {
    await this.db
      .update(moduleRoutes)
      .set({
        nombre: data.nombre,
        url: data.url,
        tipoRuta: data.tipoRuta,
        metodo: data.metodo,
        capacidadClave: toInternalRouteKey(data.url),
        accionRequerida: data.accionRequerida,
        protegida: data.protegida
      })
      .where(eq(moduleRoutes.id, id))
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(moduleRoutes).where(eq(moduleRoutes.id, id))
  }
}
