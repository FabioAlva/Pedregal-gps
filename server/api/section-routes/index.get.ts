import { fetchModuleRoutes, type ModuleRouteDto } from '~~/server/utils/module-routes'

export default defineEventHandler(async (): Promise<ModuleRouteDto[]> => {
  return await fetchModuleRoutes()
})
