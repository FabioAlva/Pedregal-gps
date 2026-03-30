import type { DbClient ,ModuleRoute } from '~~/shared/types/db'
import { NeonModuleRouteRepository } from '#layers/auth-admin/server/Repository/NeonModuleRouteRepository'
import type { ModuleRouteInput } from '#layers/auth-admin/server/Repository/Interfaces/IModuleRouteRepository'
import { matchPath } from '#layers/auth-admin/server/utils/betterauth-permissions' // Asegúrate de que apunte a tu utils/path

export class ModuleRouteService {
  private repo: NeonModuleRouteRepository

  constructor(db: DbClient) {
    this.repo = new NeonModuleRouteRepository(db)
  }

  private sanitizeRouteData(data: Partial<ModuleRouteInput>): ModuleRouteInput {
    const url = String(data.url ?? '').trim()
    if (!url) throw createError({ statusCode: 400, statusMessage: 'url es requerida' })
    const tipoRuta = data.tipoRuta === 'backend' ? 'backend' : 'frontend'
    return {
      url,
      nombre: String(data.nombre ?? '').trim() || url,
      tipoRuta,
      metodo: tipoRuta === 'backend' ? String(data.metodo ?? '').trim().toUpperCase() || null : null,
      accionRequerida: data.accionRequerida ?? null,
      protegida: data.protegida !== false
    }
  }

  async getAll() {
    return await this.repo.findAll()
  }

  async getById(id: number) {
    const row = await this.repo.findById(id)
    if (!row) throw createError({ statusCode: 404, statusMessage: `Ruta con id ${id} no encontrada` })
    return row
  }

  async create(data: Partial<ModuleRouteInput>) {
    const cleanData = this.sanitizeRouteData(data)
    return await this.repo.create(cleanData)
  }

  async update(id: number, data: Partial<ModuleRouteInput>) {
    await this.getById(id) // Valida existencia
    const cleanData = this.sanitizeRouteData(data)
    await this.repo.update(id, cleanData)
  }

  async delete(id: number) {
    await this.getById(id)
    await this.repo.delete(id)
  }

  async resolveRule(path: string, method: string): Promise<ModuleRoute | null> {
    const rules = await this.repo.findProtectedBackendRoutes()
    return rules.find((rule) => {
      const methodMatches = !rule.metodo || rule.metodo.toUpperCase() === method.toUpperCase()
      return methodMatches && matchPath(path, rule.url)
    }) ?? null
  }

  async getLinkedFrontendIds(backendId: number): Promise<number[]> {
    return await this.repo.getLinkedFrontendIds(backendId)
  }

  async updateRelatedRoutes(routeId: number, relatedIds: number[]) {
    const selectedRoute = await this.getById(routeId)
    const isBackend = selectedRoute.tipoRuta === 'backend'
    
    if (relatedIds.length > 0) {
      const expectedType = isBackend ? 'frontend' : 'backend'
      await this.repo.validateRoutesExist(relatedIds, expectedType)
    }

    return await this.repo.syncRelatedLinks(routeId, relatedIds, isBackend)
  }

  async getRelatedRoutes(id: number) {
    const route = await this.getById(id)
    const relatedRouteIds = route.tipoRuta === 'backend' 
      ? await this.repo.getLinkedFrontendIds(id)
      : await this.repo.getLinkedBackendIds(id)

    return {
      selectedRouteType: route.tipoRuta,
      relatedRouteIds
    }
  }
}