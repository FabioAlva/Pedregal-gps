import type { ModuleRoute } from '~~/shared/types/db'

export type RouteType = 'frontend' | 'backend'
export type RouteAction = 'ver' | 'agregar' | 'editar' | 'eliminar'

export type ModuleRouteInput = {
  nombre: string
  url: string
  tipoRuta: RouteType
  metodo: string | null
  accionRequerida: RouteAction | null
  protegida: boolean
}

export type ModuleRouteView = {
  id: number
  nombre: string
  url: string
  tipoRuta: RouteType
  metodo: string | null
  accionRequerida: RouteAction | null
  protegida: boolean
}

export interface IModuleRouteRepository {
  findAll(): Promise<ModuleRouteView[]>
  findById(id: number): Promise<ModuleRoute | undefined>
  create(data: ModuleRouteInput): Promise<number>
  update(id: number, data: ModuleRouteInput): Promise<void>
  delete(id: number): Promise<void>
}
