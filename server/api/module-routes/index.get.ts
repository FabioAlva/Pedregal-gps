import { db } from '@nuxthub/db'
import { ModuleRouteService } from '~~/server/services/ModuleRoute/ModuleRoute.service'

export type ModuleRouteDto = {
  id: number
  nombre: string
  url: string
  tipoRuta: 'frontend' | 'backend'
  metodo: string | null
  accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida: boolean
}

export default defineEventHandler(async (): Promise<ModuleRouteDto[]> => {
  const service = new ModuleRouteService(db)
  return await service.getAll()
})
