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



export interface IModuleRouteRepository {
  findAll(): Promise<ModuleRoute[]>
  findById(id: number): Promise<ModuleRoute | undefined>
  create(data: ModuleRouteInput): Promise<number>
  update(id: number, data: ModuleRouteInput): Promise<void>
  delete(id: number): Promise<void>
  replaceFrontendLinks(backendId: number, frontendIds: number[]): Promise<void>;
  getLinkedBackendIds(frontendId: number): Promise<number[]>; //
  getLinkedFrontendIds(backendId: number): Promise<number[]>
  findProtectedBackendRoutes(): Promise<ModuleRoute[]> // Para el middleware
  validateRoutesExist(ids: number[], expectedType: 'frontend' | 'backend'): Promise<void>;
syncRelatedLinks(routeId: number, relatedIds: number[], isBackend: boolean): Promise<void>;}