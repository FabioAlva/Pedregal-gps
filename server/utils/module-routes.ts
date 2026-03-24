import { asc } from 'drizzle-orm'
import { db } from '@nuxthub/db'
import { moduleRoutes } from '~~/server/db/schema'

export interface ModuleRouteDto {
  id: number
  nombre: string
  url: string
  tipoRuta: 'frontend' | 'backend'
  metodo: string | null
  accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida: boolean
}

function isMissingRelationError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  return (error as { code?: string }).code === '42P01'
}

export async function fetchModuleRoutes(): Promise<ModuleRouteDto[]> {
  try {
    return await db
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
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new Error('La tabla rutas_modulo no existe. Ejecuta las migraciones de rutas de modulo.')
    }

    throw error
  }
}
