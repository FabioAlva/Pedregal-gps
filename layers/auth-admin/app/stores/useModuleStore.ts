// stores/useModuleStore.ts
export const useModuleStore = defineStore('module', () => {
  const routes = ref<ModuleRoute[]>([])
  const isLoading = ref(false)

  const fetchRoutes = async () => {
    if (routes.value.length > 0) return
    isLoading.value = true
    try {
      routes.value = await $fetch<ModuleRoute[]>('/api/module-routes')
    } finally {
      isLoading.value = false
    }
  }

  const addRoute = (newRoute: ModuleRoute) => {
     routes.value = [...routes.value, newRoute]
  }

  const updateRouteInStore = (updatedRoute: ModuleRoute) => {
    const index = routes.value.findIndex(r => r.id === updatedRoute.id)
    if (index !== -1) {
      const newArray = [...routes.value]
      newArray[index] = updatedRoute
      routes.value = newArray
    }
  }

  return { routes, isLoading, fetchRoutes, addRoute, updateRouteInStore }
})