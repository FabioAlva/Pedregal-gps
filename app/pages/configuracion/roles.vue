<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { resolveBestAuthorizedFrontendRoute } from '~/lib/post-login-route'
import { resolveRouteByPath, type FrontPermissionPayload } from '~/lib/route-permissions'

type RoleRow = {
  id: number
  nombre: string
  descripcion: string | null
}

type ModuleRouteRow = {
  id: number
  nombre: string
  url: string
  tipoRuta: 'frontend' | 'backend'
  metodo: string | null
  accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida: boolean
}

type RoleRoutePermissionRow = {
  id: number
  rolId: number
  rutaModuloId: number
  rutaNombre: string
  rutaUrl: string
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

type UserRow = {
  id: string
  name: string
  email: string
}

type UserRoleRow = {
  userId: string
  rolId: number
  rolNombre: string
  asignadoEl: string
}

type PermissionFlags = {
  ver: boolean
  agregar: boolean
  editar: boolean
  eliminar: boolean
}

type RoleFormPayload = {
  id?: number
  nombre: string
  descripcion: string
}

type ModuleRouteFormPayload = {
  id?: number
  nombre: string
  url: string
  tipoRuta: 'frontend' | 'backend'
  metodo: string | null
  accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
  protegida: boolean
}

type UserFormPayload = {
  id?: string
  name: string
  email: string
  password?: string
}

const toast = useToast()
const route = useRoute()

const activeSection = ref<'roles' | 'paginas' | 'usuarios'>('roles')

const isBootLoading = ref(false)
const isRoleRoutePermissionsLoading = ref(false)
const isSavingRoleRoutePermissions = ref(false)
const isSavingRoleForm = ref(false)
const isModuleRoutesLoading = ref(false)
const isSavingModuleRouteForm = ref(false)
const isDeletingModuleRoute = ref(false)
const isLoadingRelatedRoutes = ref(false)
const isSavingRelatedRoutes = ref(false)
const isSavingUserForm = ref(false)
const isDeletingRole = ref(false)
const isUserRolesLoading = ref(false)
const isSavingUserRoles = ref(false)

const roles = ref<RoleRow[]>([])
const moduleRoutes = ref<ModuleRouteRow[]>([])
const users = ref<UserRow[]>([])

const selectedRoleId = ref<number | undefined>(undefined)
const selectedUserId = ref<string | null>(null)

const roleModalOpen = ref(false)
const roleModalValue = ref<RoleRow | null>(null)
const moduleRouteModalOpen = ref(false)
const moduleRouteModalValue = ref<ModuleRouteRow | null>(null)
const userModalOpen = ref(false)
const userModalValue = ref<UserRow | null>(null)

const roleSearch = ref('')
const moduleRouteSearch = ref('')
const userSearch = ref('')
const relatedRouteSearch = ref('')
const relatedActionFilter = ref<'all' | 'ver' | 'agregar' | 'editar' | 'eliminar'>('all')
const relatedRouteToAddId = ref<number | undefined>(undefined)

const selectedModuleRouteId = ref<number | undefined>(undefined)
const relatedRouteIdsDraft = ref<Set<number>>(new Set())

const roleRoutePermissionsDraft = ref<Record<number, PermissionFlags>>({})
const userRoleIdsDraft = ref<Set<number>>(new Set())

const filteredRoles = computed(() => {
  const term = roleSearch.value.trim().toLowerCase()
  if (!term) return roles.value

  return roles.value.filter((role) => {
    return role.nombre.toLowerCase().includes(term) || (role.descripcion ?? '').toLowerCase().includes(term)
  })
})

const filteredUsers = computed(() => {
  const term = userSearch.value.trim().toLowerCase()
  if (!term) return users.value

  return users.value.filter((user) => {
    return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
  })
})

const selectedRole = computed(() => {
  return roles.value.find((role) => role.id === selectedRoleId.value) ?? null
})

const selectedModuleRoute = computed(() => {
  return moduleRoutes.value.find((route) => route.id === selectedModuleRouteId.value) ?? null
})

const selectedModuleRouteIdModel = computed<number | undefined>({
  get: () => selectedModuleRouteId.value ?? undefined,
  set: (value) => {
    selectedModuleRouteId.value = value ?? undefined
  }
})

const relatedRouteToAddIdModel = computed<number | undefined>({
  get: () => relatedRouteToAddId.value ?? undefined,
  set: (value) => {
    relatedRouteToAddId.value = value ?? undefined
  }
})

const filteredModuleRoutes = computed(() => {
  const term = moduleRouteSearch.value.trim().toLowerCase()
  if (!term) return moduleRoutes.value

  return moduleRoutes.value.filter((route) => {
    return route.url.toLowerCase().includes(term)
      || route.nombre.toLowerCase().includes(term)
      || route.tipoRuta.toLowerCase().includes(term)
      || (route.metodo ?? '').toLowerCase().includes(term)
  })
})

const filteredFrontendRoutesForRelations = computed(() => {
  const term = moduleRouteSearch.value.trim().toLowerCase()
  const frontendRoutes = frontendProtectedRoutes.value

  if (!term) return frontendRoutes

  return frontendRoutes.filter((route) => {
    return route.url.toLowerCase().includes(term)
      || route.nombre.toLowerCase().includes(term)
      || (route.metodo ?? '').toLowerCase().includes(term)
  })
})

const frontendRouteSelectItems = computed(() => {
  return filteredFrontendRoutesForRelations.value.map(route => ({
    // Show page name first, then URL, no comma, compact
    label: `${route.nombre} ${route.url}`,
    value: route.id
  }))
})

const frontendProtectedRoutes = computed(() => {
  return moduleRoutes.value
    .filter(route => route.tipoRuta === 'frontend' && route.protegida)
    .sort((a, b) => a.url.localeCompare(b.url))
})

const backendProtectedRoutes = computed(() => {
  return moduleRoutes.value
    .filter(route => route.tipoRuta === 'backend' && route.protegida)
    .sort((a, b) => {
      const byUrl = a.url.localeCompare(b.url)
      if (byUrl !== 0) return byUrl
      return (a.metodo ?? '').localeCompare(b.metodo ?? '')
    })
})

const canManageRelatedRoutes = computed(() => {
  return selectedModuleRoute.value?.tipoRuta === 'frontend'
})

const relatedRouteCandidates = computed(() => {
  if (!canManageRelatedRoutes.value) return []
  return backendProtectedRoutes.value
})

const relatedActionOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'ver', label: 'Ver' },
  { value: 'agregar', label: 'Agregar' },
  { value: 'editar', label: 'Editar' },
  { value: 'eliminar', label: 'Eliminar' }
] as const

const inferActionByMethod = (method: string | null): 'ver' | 'agregar' | 'editar' | 'eliminar' => {
  switch ((method ?? '').toUpperCase()) {
    case 'POST':
      return 'agregar'
    case 'PUT':
    case 'PATCH':
      return 'editar'
    case 'DELETE':
      return 'eliminar'
    default:
      return 'ver'
  }
}

const resolveBackendAction = (route: ModuleRouteRow): 'ver' | 'agregar' | 'editar' | 'eliminar' => {
  return route.accionRequerida ?? inferActionByMethod(route.metodo)
}

const filteredRelatedRouteCandidates = computed(() => {
  const term = relatedRouteSearch.value.trim().toLowerCase()
  const actionFilter = relatedActionFilter.value
  return relatedRouteCandidates.value.filter((route) => {
    const routeAction = resolveBackendAction(route)
    const matchesAction = actionFilter === 'all' || routeAction === actionFilter
    if (!matchesAction) return false
    if (!term) return true

    return route.url.toLowerCase().includes(term)
      || route.nombre.toLowerCase().includes(term)
      || route.tipoRuta.toLowerCase().includes(term)
      || (route.metodo ?? '').toLowerCase().includes(term)
      || routeAction.toLowerCase().includes(term)
  })
})

const selectedRelatedRoutes = computed(() => {
  return relatedRouteCandidates.value.filter(route => relatedRouteIdsDraft.value.has(route.id))
})

const relatedRouteRows = computed(() => {
  return filteredRelatedRouteCandidates.value
    .filter(route => relatedRouteIdsDraft.value.has(route.id))
    .sort((a, b) => {
    const byUrl = a.url.localeCompare(b.url)
    if (byUrl !== 0) return byUrl
    return (a.metodo ?? '').localeCompare(b.metodo ?? '')
  })
})

const availableRoutesToAdd = computed(() => {
  return filteredRelatedRouteCandidates.value
    .filter(route => !relatedRouteIdsDraft.value.has(route.id))
    .sort((a, b) => a.url.localeCompare(b.url))
    .map(route => ({
      value: route.id,
      label: `${route.url}${route.metodo ? ` ${route.metodo}` : ''}`
    }))
})

const selectedUser = computed(() => {
  return users.value.find((user) => user.id === selectedUserId.value) ?? null
})

const routePermissionRows = computed(() => {
  const protectedRoutes = moduleRoutes.value
    .filter(route => route.protegida && route.tipoRuta === 'frontend')
    .sort((a, b) => a.url.localeCompare(b.url))

  return protectedRoutes.map((route) => {
    if (!roleRoutePermissionsDraft.value[route.id]) {
      roleRoutePermissionsDraft.value[route.id] = {
        ver: false,
        agregar: false,
        editar: false,
        eliminar: false
      }
    }

    return {
      ...route,
      flags: roleRoutePermissionsDraft.value[route.id]!
    }
  })
})

const ensureRoutePermissionDraft = () => {
  const next: Record<number, PermissionFlags> = {}

  for (const route of moduleRoutes.value) {
    if (!route.protegida || route.tipoRuta !== 'frontend') continue

    const current = roleRoutePermissionsDraft.value[route.id]
    next[route.id] = {
      ver: current?.ver ?? false,
      agregar: current?.agregar ?? false,
      editar: current?.editar ?? false,
      eliminar: current?.eliminar ?? false
    }
  }

  roleRoutePermissionsDraft.value = next
}

const loadBaseData = async () => {
  isBootLoading.value = true

  try {
    const [rolesRes, usersRes] = await Promise.all([
      $fetch<RoleRow[]>('/api/roles'),
      $fetch<UserRow[]>('/api/users')
    ])

    roles.value = rolesRes
    users.value = usersRes

    if (!selectedRoleId.value && roles.value.length > 0) selectedRoleId.value = roles.value[0]!.id
    if (!selectedUserId.value && users.value.length > 0) selectedUserId.value = users.value[0]!.id
  } catch (error: any) {
    toast.add({
      title: 'No se pudo cargar configuración',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isBootLoading.value = false
  }
}

const loadModuleRoutes = async () => {
  isModuleRoutesLoading.value = true

  try {
    const rows = await $fetch<ModuleRouteRow[]>('/api/module-routes')
    moduleRoutes.value = rows
    ensureRoutePermissionDraft()

    if (!selectedModuleRouteId.value && moduleRoutes.value.length > 0) {
      selectedModuleRouteId.value = frontendProtectedRoutes.value[0]?.id ?? moduleRoutes.value[0]!.id
    }

    if (selectedModuleRouteId.value) {
      const selected = rows.find(route => route.id === selectedModuleRouteId.value)
      if (!selected || selected.tipoRuta !== 'frontend' || !selected.protegida) {
        selectedModuleRouteId.value = frontendProtectedRoutes.value[0]?.id ?? undefined
      }
    }
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron cargar rutas',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isModuleRoutesLoading.value = false
  }
}

const loadRelatedRoutes = async (routeId: number | undefined) => {
  relatedRouteIdsDraft.value = new Set<number>()
  relatedRouteSearch.value = ''
  relatedActionFilter.value = 'all'
  relatedRouteToAddId.value = undefined
  if (!routeId) return

  const selected = moduleRoutes.value.find(route => route.id === routeId)
  if (!selected || selected.tipoRuta !== 'frontend') return

  isLoadingRelatedRoutes.value = true

  try {
    const response = await $fetch<{ selectedRouteType: 'frontend' | 'backend', relatedRouteIds: number[] }>(
      `/api/module-routes/${routeId}/related-routes`
    )
    relatedRouteIdsDraft.value = new Set(response.relatedRouteIds ?? [])
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron cargar relaciones de ruta',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isLoadingRelatedRoutes.value = false
  }
}

const toggleRelatedRoute = (relatedRouteId: number) => {
  const next = new Set(relatedRouteIdsDraft.value)
  if (next.has(relatedRouteId)) next.delete(relatedRouteId)
  else next.add(relatedRouteId)
  relatedRouteIdsDraft.value = next
}

const addRelatedRoute = () => {
  if (!relatedRouteToAddId.value) return
  const next = new Set(relatedRouteIdsDraft.value)
  next.add(relatedRouteToAddId.value)
  relatedRouteIdsDraft.value = next
  relatedRouteToAddId.value = undefined
}

const selectAllFilteredRelatedRoutes = () => {
  const next = new Set(relatedRouteIdsDraft.value)
  for (const route of filteredRelatedRouteCandidates.value) {
    next.add(route.id)
  }
  relatedRouteIdsDraft.value = next
}

const clearAllRelatedRoutes = () => {
  relatedRouteIdsDraft.value = new Set<number>()
}

const saveRelatedRoutes = async () => {
  const selectedRoute = selectedModuleRoute.value
  if (!selectedRoute) return

  isSavingRelatedRoutes.value = true

  try {
    await $fetch(`/api/module-routes/${selectedRoute.id}/related-routes`, {
      method: 'PUT',
      body: {
        relatedRouteIds: Array.from(relatedRouteIdsDraft.value)
      }
    })

    toast.add({
      title: 'Relaciones guardadas',
      description: 'La relación entre rutas frontend y backend fue actualizada.',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron guardar relaciones',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSavingRelatedRoutes.value = false
  }
}

const loadRoleRoutePermissions = async (roleId: number | null) => {
  roleRoutePermissionsDraft.value = {}
  ensureRoutePermissionDraft()
  if (!roleId) return

  isRoleRoutePermissionsLoading.value = true

  try {
    const rows = await $fetch<RoleRoutePermissionRow[]>(`/api/roles/${roleId}/route-permissions`)

    for (const row of rows) {
      roleRoutePermissionsDraft.value[row.rutaModuloId] = {
        ver: row.ver,
        agregar: row.agregar,
        editar: row.editar,
        eliminar: row.eliminar
      }
    }
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron cargar permisos por ruta',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isRoleRoutePermissionsLoading.value = false
  }
}

const loadUserRoles = async (userId: string | null) => {
  userRoleIdsDraft.value = new Set<number>()
  if (!userId) return

  isUserRolesLoading.value = true

  try {
    const rows = await $fetch<UserRoleRow[]>(`/api/users/${userId}/roles`)
    userRoleIdsDraft.value = new Set(rows.map((row) => row.rolId))
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron cargar roles del usuario',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUserRolesLoading.value = false
  }
}

const openCreateRoleModal = () => {
  roleModalValue.value = null
  roleModalOpen.value = true
}

const openEditRoleModal = () => {
  if (!selectedRole.value) return
  roleModalValue.value = selectedRole.value
  roleModalOpen.value = true
}

const saveRole = async (payload: RoleFormPayload) => {
  const nombre = payload.nombre.trim()
  const descripcion = payload.descripcion.trim()

  if (!nombre) {
    toast.add({
      title: 'Nombre requerido',
      description: 'Ingresa un nombre para el rol.',
      color: 'warning',
      icon: 'i-lucide-info'
    })
    return
  }

  isSavingRoleForm.value = true

  try {
    if (payload.id) {
      await $fetch(`/api/roles/${payload.id}`, {
        method: 'PATCH',
        body: { nombre, descripcion: descripcion || null }
      })

      toast.add({
        title: 'Rol actualizado',
        description: 'Se guardaron los datos del rol.',
        color: 'success',
        icon: 'i-lucide-check'
      })
    } else {
      await $fetch('/api/roles', {
        method: 'POST',
        body: { nombre, descripcion: descripcion || null }
      })

      toast.add({
        title: 'Rol creado',
        description: `Se creó el rol ${nombre}.`,
        color: 'success',
        icon: 'i-lucide-check'
      })
    }

    await loadBaseData()
    const roleMatch = roles.value.find((role) => role.nombre === nombre)
    if (roleMatch) selectedRoleId.value = roleMatch.id
    await loadRoleRoutePermissions(selectedRoleId.value)
    roleModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: payload.id ? 'No se pudo actualizar el rol' : 'No se pudo crear el rol',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSavingRoleForm.value = false
  }
}

const deleteSelectedRole = async () => {
  if (!selectedRoleId.value || !selectedRole.value) return
  const confirmed = confirm(`¿Desactivar el rol ${selectedRole.value.nombre}?`)
  if (!confirmed) return

  isDeletingRole.value = true

  try {
    await $fetch(`/api/roles/${selectedRoleId.value}`, { method: 'DELETE' })

    const deletedRoleId = selectedRoleId.value
    await loadBaseData()
    if (selectedRoleId.value === deletedRoleId) selectedRoleId.value = roles.value[0]?.id ?? undefined
    await loadRoleRoutePermissions(selectedRoleId.value)

    toast.add({
      title: 'Rol desactivado',
      description: 'El rol fue desactivado de forma lógica.',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'No se pudo desactivar el rol',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isDeletingRole.value = false
  }
}

const saveRoleRoutePermissions = async () => {
  if (!selectedRoleId.value) return
  isSavingRoleRoutePermissions.value = true

  try {
    const payload = Object.entries(roleRoutePermissionsDraft.value)
      .filter(([, flags]) => flags.ver || flags.agregar || flags.editar || flags.eliminar)
      .map(([routeId, flags]) => ({
        rutaModuloId: Number(routeId),
        ver: flags.ver,
        agregar: flags.agregar,
        editar: flags.editar,
        eliminar: flags.eliminar
      }))

    await $fetch(`/api/roles/${selectedRoleId.value}/route-permissions`, {
      method: 'PUT',
      body: { permissions: payload }
    })

    const permissionsState = useState<FrontPermissionPayload | null>('auth:my-permissions', () => null)
    const permissionsUserIdState = useState<string | null>('auth:permissions-user-id', () => null)
    permissionsState.value = null
    permissionsUserIdState.value = null


    const [matchedCurrentRoute, myPermissions] = await Promise.all([
      resolveRouteByPath(route.path),
      $fetch<FrontPermissionPayload>('/api/auth/mis-permisos')
    ])

    // LOG TEMPORAL PARA DEPURACIÓN
    // eslint-disable-next-line no-console
    console.log('[DEBUG] matchedCurrentRoute:', matchedCurrentRoute)
    // eslint-disable-next-line no-console
    console.log('[DEBUG] myPermissions:', myPermissions)

    const hasAccessToCurrentRoute = matchedCurrentRoute?.id
      ? myPermissions.routes?.[matchedCurrentRoute.id]?.ver === true
      : true

    toast.add({
      title: 'Permisos por ruta guardados',
      description: 'Se actualizaron las reglas puntuales por URL.',
      color: 'success',
      icon: 'i-lucide-check'
    })

    if (!hasAccessToCurrentRoute) {
      const fallbackRoute = await resolveBestAuthorizedFrontendRoute()

      toast.add({
        title: 'Tu acceso a esta pagina cambio',
        description: fallbackRoute
          ? 'Se te redirigio a la primera ruta frontend que aun tienes permitida.'
          : 'Ya no tienes rutas frontend permitidas para navegar.',
        color: 'warning',
        icon: 'i-lucide-shield-alert'
      })

      if (fallbackRoute) {
        await navigateTo(fallbackRoute, { replace: true })
      } else {
        await navigateTo('/login', { replace: true })
      }
    }
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron guardar permisos por ruta',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    const saveRoleRoutePermissions = async () => {
      if (!selectedRoleId.value) return

      // Validar que al menos una ruta frontend tenga permiso VER
      const hasAnyFrontendVer = moduleRoutes.value.some(route =>
        route.protegida && route.tipoRuta === 'frontend' && roleRoutePermissionsDraft.value[route.id]?.ver === true
      )
      if (!hasAnyFrontendVer) {
        toast.add({
          title: 'Permiso insuficiente',
          description: 'El rol debe tener al menos una ruta frontend con permiso VER. Si no, el usuario será expulsado al login.',
          color: 'warning',
          icon: 'i-lucide-shield-alert'
        })
        return
      }

      isSavingRoleRoutePermissions.value = true
      try {
        const payload = Object.entries(roleRoutePermissionsDraft.value)
          .filter(([, flags]) => flags.ver || flags.agregar || flags.editar || flags.eliminar)
          .map(([routeId, flags]) => ({
            rutaModuloId: Number(routeId),
            ver: flags.ver,
            agregar: flags.agregar,
            editar: flags.editar,
            eliminar: flags.eliminar
          }))

        await $fetch(`/api/roles/${selectedRoleId.value}/route-permissions`, {
          method: 'PUT',
          body: { permissions: payload }
        })

        const permissionsState = useState<FrontPermissionPayload | null>('auth:my-permissions', () => null)
        const permissionsUserIdState = useState<string | null>('auth:permissions-user-id', () => null)
        permissionsState.value = null
        permissionsUserIdState.value = null

        const [matchedCurrentRoute, myPermissions] = await Promise.all([
          resolveRouteByPath(route.path),
          $fetch<FrontPermissionPayload>('/api/auth/mis-permisos')
        ])

        const hasAccessToCurrentRoute = matchedCurrentRoute?.id
          ? myPermissions.routes?.[matchedCurrentRoute.id]?.ver === true
          : true

        toast.add({
          title: 'Permisos por ruta guardados',
          description: 'Se actualizaron las reglas puntuales por URL.',
          color: 'success',
          icon: 'i-lucide-check'
        })

        if (!hasAccessToCurrentRoute) {
          const fallbackRoute = await resolveBestAuthorizedFrontendRoute()

          toast.add({
            title: 'Tu acceso a esta pagina cambio',
            description: fallbackRoute
              ? 'Se te redirigio a la primera ruta frontend que aun tienes permitida.'
              : 'Ya no tienes rutas frontend permitidas para navegar.',
            color: 'warning',
            icon: 'i-lucide-shield-alert'
          })

          if (fallbackRoute) {
            await navigateTo(fallbackRoute, { replace: true })
          } else {
            await navigateTo('/login', { replace: true })
          }
        }
      } catch (error: any) {
        toast.add({
          title: 'No se pudieron guardar permisos por ruta',
          description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
          color: 'error',
          icon: 'i-lucide-circle-alert'
        })
      } finally {
        isSavingRoleRoutePermissions.value = false
      }
    }
    })
    if (routeMatch) selectedModuleRouteId.value = routeMatch.id

    moduleRouteModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: payload.id ? 'No se pudo actualizar la ruta' : 'No se pudo crear la ruta',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSavingModuleRouteForm.value = false
  }
}

const deleteSelectedModuleRoute = async () => {
  if (!selectedModuleRoute.value) return

  const confirmed = confirm(`¿Eliminar la ruta ${selectedModuleRoute.value.url}?`)
  if (!confirmed) return

  isDeletingModuleRoute.value = true

  try {
    const removedId = selectedModuleRoute.value.id
    await $fetch(`/api/module-routes/${removedId}`, { method: 'DELETE' })
    await loadModuleRoutes()

    if (selectedModuleRouteId.value === removedId) {
      selectedModuleRouteId.value = filteredModuleRoutes.value[0]?.id ?? undefined
    }

    toast.add({
      title: 'Ruta eliminada',
      description: 'La ruta fue eliminada.',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'No se pudo eliminar la ruta',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isDeletingModuleRoute.value = false
  }
}

const openCreateUserModal = () => {
  userModalValue.value = null
  userModalOpen.value = true
}

const openEditUserModal = () => {
  if (!selectedUser.value) return
  userModalValue.value = selectedUser.value
  userModalOpen.value = true
}

const saveUser = async (payload: UserFormPayload) => {
  const name = payload.name.trim()
  const email = payload.email.trim().toLowerCase()
  const password = String(payload.password ?? '').trim()

  if (!name || !email) {
    toast.add({
      title: 'Datos requeridos',
      description: 'Ingresa nombre y email.',
      color: 'warning',
      icon: 'i-lucide-info'
    })
    return
  }

  if (!payload.id && password.length < 6) {
    toast.add({
      title: 'Contraseña inválida',
      description: 'Debe tener al menos 6 caracteres.',
      color: 'warning',
      icon: 'i-lucide-info'
    })
    return
  }

  isSavingUserForm.value = true

  try {
    if (payload.id) {
      await $fetch(`/api/users/${payload.id}`, {
        method: 'PATCH',
        body: { name, email }
      })

      toast.add({
        title: 'Usuario actualizado',
        description: 'Se guardaron los datos del usuario.',
        color: 'success',
        icon: 'i-lucide-check'
      })
    } else {
      const created = await $fetch<{ id: string }>('/api/users', {
        method: 'POST',
        body: { name, email, password }
      })
      selectedUserId.value = created.id

      toast.add({
        title: 'Usuario creado',
        description: `${name} fue registrado.`,
        color: 'success',
        icon: 'i-lucide-check'
      })
    }

    await loadBaseData()
    const userMatch = users.value.find((u) => u.email.toLowerCase() === email)
    if (userMatch) selectedUserId.value = userMatch.id
    await loadUserRoles(selectedUserId.value)
    userModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: payload.id ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSavingUserForm.value = false
  }
}

const toggleUserRole = (roleId: number) => {
  const next = new Set(userRoleIdsDraft.value)
  if (next.has(roleId)) next.delete(roleId)
  else next.add(roleId)
  userRoleIdsDraft.value = next
}

const saveUserRoles = async () => {
  if (!selectedUserId.value) return
  isSavingUserRoles.value = true

  try {
    await $fetch(`/api/users/${selectedUserId.value}/roles`, {
      method: 'PUT',
      body: {
        roleIds: Array.from(userRoleIdsDraft.value)
      }
    })

    toast.add({
      title: 'Roles actualizados',
      description: 'Se actualizaron los roles del usuario.',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'No se pudieron guardar roles del usuario',
      description: error?.statusMessage ?? error?.message ?? 'Intenta nuevamente.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSavingUserRoles.value = false
  }
}

watch(selectedRoleId, async (newRoleId) => {
  await loadRoleRoutePermissions(newRoleId)
})

watch(selectedUserId, async (newUserId) => {
  await loadUserRoles(newUserId)
})

watch(selectedModuleRouteId, async (newRouteId) => {
  await loadRelatedRoutes(newRouteId)
})

onMounted(async () => {
  await loadBaseData()
  await loadModuleRoutes()
  await Promise.all([
    loadRoleRoutePermissions(selectedRoleId.value),
    loadUserRoles(selectedUserId.value)
  ])
})
</script>

<template>
  <div class="w-full h-full overflow-y-auto p-5 md:p-6">
    <div class="max-w-[1400px] mx-auto flex flex-col gap-5">
      <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Configuración</p>
          <h1 class="text-2xl font-extrabold text-highlighted">Usuarios, Roles y Rutas</h1>
          <p class="text-sm text-muted">Organiza accesos por ruta y administra las URLs protegidas.</p>
        </div>

        <div class="inline-flex rounded-lg border border-default bg-elevated p-1 w-fit">
          <button
            class="px-3 py-2 text-sm rounded-md transition"
            :class="activeSection === 'roles' ? 'bg-default text-highlighted ring-1 ring-default' : 'text-muted hover:text-highlighted'"
            @click="activeSection = 'roles'"
          >
            Roles
          </button>
          <button
            class="px-3 py-2 text-sm rounded-md transition"
            :class="activeSection === 'paginas' ? 'bg-default text-highlighted ring-1 ring-default' : 'text-muted hover:text-highlighted'"
            @click="activeSection = 'paginas'"
          >
            Rutas
          </button>
          <button
            class="px-3 py-2 text-sm rounded-md transition"
            :class="activeSection === 'usuarios' ? 'bg-default text-highlighted ring-1 ring-default' : 'text-muted hover:text-highlighted'"
            @click="activeSection = 'usuarios'"
          >
            Usuarios
          </button>
        </div>
      </header>

      <UAlert
        v-if="isBootLoading"
        color="primary"
        variant="soft"
        icon="i-lucide-loader-circle"
        description="Cargando configuración..."
      />

      <template v-if="activeSection === 'roles'">
        <div class="space-y-5">
          <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-semibold text-highlighted">Seleccion de roles</h2>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <UButton color="primary" icon="i-lucide-plus" @click="openCreateRoleModal">
                    Crear rol
                  </UButton>
                  <UButton color="neutral" variant="soft" icon="i-lucide-pencil" :disabled="!selectedRole" @click="openEditRoleModal">
                    Editar rol
                  </UButton>
                  <UButton
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash-2"
                    :loading="isDeletingRole"
                    :disabled="!selectedRole"
                    @click="deleteSelectedRole"
                  >
                    Desactivar rol
                  </UButton>
                </div>
              </div>
            </template>
            <div class="space-y-4">
              <UFormField label="Rol seleccionado">
                <USelect
                  v-model="selectedRoleId"
                  :items="filteredRoles.map(role => ({ label: `${role.nombre}${role.descripcion ? ' - ' + role.descripcion : ''}`, value: role.id }))"
                  placeholder="Selecciona un rol"
                  :disabled="filteredRoles.length === 0"
                  class="w-full"
                />
              </UFormField>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-semibold text-highlighted">Permisos por ruta</h2>
                </div>
                <UButton
                  color="primary"
                  icon="i-lucide-route"
                  :loading="isSavingRoleRoutePermissions"
                  :disabled="isRoleRoutePermissionsLoading || !selectedRole"
                  @click="saveRoleRoutePermissions"
                >
                  Guardar permisos por ruta
                </UButton>
              </div>
            </template>
            <div class="overflow-auto border border-default rounded-xl">
              <table class="w-full min-w-[980px] text-sm">
                <thead class="bg-elevated border-b border-default">
                  <tr>
                    <th class="text-left p-3 font-semibold">Ruta</th>
                    <th class="text-center p-3 font-semibold">Ver</th>
                    <th class="text-center p-3 font-semibold">Agregar</th>
                    <th class="text-center p-3 font-semibold">Editar</th>
                    <th class="text-center p-3 font-semibold">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="route in routePermissionRows" :key="route.id" class="border-b border-default last:border-b-0">
                    <td class="p-3.5">
                      <p class="font-medium text-highlighted">{{ route.url }}</p>
                      <p class="text-xs text-muted mt-1">{{ route.nombre }}</p>
                    </td>
                    <td class="p-3 text-center">
                      <input v-model="route.flags.ver" type="checkbox" class="h-4 w-4" :disabled="isRoleRoutePermissionsLoading" />
                    </td>
                    <td class="p-3 text-center">
                      <input v-model="route.flags.agregar" type="checkbox" class="h-4 w-4" :disabled="isRoleRoutePermissionsLoading" />
                    </td>
                    <td class="p-3 text-center">
                      <input v-model="route.flags.editar" type="checkbox" class="h-4 w-4" :disabled="isRoleRoutePermissionsLoading" />
                    </td>
                    <td class="p-3 text-center">
                      <input v-model="route.flags.eliminar" type="checkbox" class="h-4 w-4" :disabled="isRoleRoutePermissionsLoading" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>
      </template>

      <template v-else-if="activeSection === 'paginas'">
        <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-semibold text-highlighted">Rutas</h2>
                  <p class="text-xs text-muted mt-1">Alta y mantenimiento de rutas protegidas.</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs text-muted">{{ filteredFrontendRoutesForRelations.length }} rutas frontend</span>
                  <UButton color="primary" icon="i-lucide-plus" @click="openCreateModuleRouteModal">
                    Crear ruta
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-pencil"
                    :disabled="!selectedModuleRoute"
                    @click="openEditModuleRouteModal"
                  >
                    Editar ruta
                  </UButton>
                  <UButton
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash-2"
                    :loading="isDeletingModuleRoute"
                    :disabled="!selectedModuleRoute"
                    @click="deleteSelectedModuleRoute"
                  >
                    Eliminar ruta
                  </UButton>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-3 items-end">
                <UInput v-model="moduleRouteSearch" icon="i-lucide-search" placeholder="Buscar ruta frontend..." />

                <UFormField label="Ruta frontend para relacionar">
                  <USelect
                    v-model="selectedModuleRouteIdModel"
                    :items="frontendRouteSelectItems"
                    :disabled="isModuleRoutesLoading || frontendRouteSelectItems.length === 0"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div v-if="isModuleRoutesLoading" class="text-sm text-muted">
                Cargando rutas...
              </div>

              <div v-else-if="frontendRouteSelectItems.length === 0" class="text-sm text-muted">
                No hay rutas frontend protegidas para el filtro actual.
              </div>

              <UCard v-if="selectedModuleRoute && canManageRelatedRoutes" class="border border-default">
                <template #header>
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 class="font-semibold text-highlighted">Relación de rutas frontend y backend</h3>
                      <p class="text-xs text-muted mt-1">
                        Define qué endpoints backend están disponibles para {{ selectedModuleRoute.url }}.
                      </p>

                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <UBadge color="neutral" variant="soft" size="sm">
                          Seleccionadas: {{ selectedRelatedRoutes.length }}
                        </UBadge>
                        <UBadge color="neutral" variant="soft" size="sm">
                          Disponibles: {{ relatedRouteCandidates.length }}
                        </UBadge>
                      </div>
                    </div>

                    <UButton
                      color="primary"
                      icon="i-lucide-save"
                      :loading="isSavingRelatedRoutes"
                      :disabled="isLoadingRelatedRoutes"
                      @click="saveRelatedRoutes"
                    >
                      Guardar relación
                    </UButton>
                  </div>
                </template>

                <div v-if="isLoadingRelatedRoutes" class="text-sm text-muted">
                  Cargando relaciones...
                </div>

                <div v-else class="space-y-3">
                  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <UInput
                      v-model="relatedRouteSearch"
                      icon="i-lucide-search"
                      placeholder="Buscar ruta por URL, nombre o método..."
                      class="w-full md:max-w-md"
                    />

                    <div class="flex flex-wrap items-center gap-2">
                      <USelect
                        v-model="relatedRouteToAddIdModel"
                        :items="availableRoutesToAdd"
                        placeholder="Agregar endpoint backend"
                        :disabled="availableRoutesToAdd.length === 0"
                        class="w-full sm:w-72"
                      />

                      <UButton
                        size="xs"
                        color="primary"
                        variant="soft"
                        icon="i-lucide-plus"
                        :disabled="!relatedRouteToAddId"
                        @click="addRelatedRoute"
                      >
                        Agregar
                      </UButton>

                      <UButton
                        size="xs"
                        color="neutral"
                        variant="soft"
                        icon="i-lucide-eraser"
                        :disabled="selectedRelatedRoutes.length === 0"
                        @click="clearAllRelatedRoutes"
                      >
                        Limpiar selección
                      </UButton>
                    </div>
                  </div>

                  <div class="rounded-lg border border-default">
                    <div class="px-3 py-2 border-b border-default bg-elevated flex flex-wrap items-center gap-2">
                      <p class="text-xs font-semibold text-muted uppercase tracking-wide">Endpoints backend relacionados</p>
                      <UBadge color="neutral" variant="soft" size="sm">Marcados arriba = ya seleccionados</UBadge>
                    </div>

                    <div class="px-3 py-2 border-b border-default bg-default/40 flex flex-wrap items-center gap-2">
                      <span class="text-xs text-muted">Filtrar por acción:</span>
                      <UButton
                        v-for="option in relatedActionOptions"
                        :key="option.value"
                        size="xs"
                        :color="relatedActionFilter === option.value ? 'primary' : 'neutral'"
                        :variant="relatedActionFilter === option.value ? 'solid' : 'soft'"
                        @click="relatedActionFilter = option.value"
                      >
                        {{ option.label }}
                      </UButton>
                    </div>

                    <div class="max-h-[420px] overflow-y-auto p-2 space-y-2">
                      <label
                        v-for="relatedRoute in relatedRouteRows"
                        :key="relatedRoute.id"
                        class="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition"
                        :class="relatedRouteIdsDraft.has(relatedRoute.id) ? 'border-primary/40 bg-primary/5' : 'border-default hover:bg-elevated'"
                      >
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-highlighted truncate">{{ relatedRoute.url }}</p>
                            <UBadge v-if="relatedRoute.metodo" color="warning" variant="soft" size="sm">
                              {{ relatedRoute.metodo }}
                            </UBadge>
                            <UBadge color="info" variant="soft" size="sm">
                              {{ resolveBackendAction(relatedRoute) }}
                            </UBadge>
                          </div>

                          <p class="text-xs text-muted mt-1 truncate">{{ relatedRoute.nombre }}</p>
                        </div>

                        <input
                          type="checkbox"
                          class="h-4 w-4"
                          :checked="relatedRouteIdsDraft.has(relatedRoute.id)"
                          @change="toggleRelatedRoute(relatedRoute.id)"
                        >
                      </label>

                      <div v-if="relatedRouteRows.length === 0" class="text-sm text-muted px-1 py-2">
                        No hay endpoints relacionados para este filtro.
                      </div>
                    </div>
                  </div>

                  <div v-if="relatedRouteCandidates.length === 0" class="text-sm text-muted">
                    No hay rutas protegidas disponibles para relacionar.
                  </div>
                </div>
              </UCard>

            </div>
        </UCard>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5">
          <UCard class="h-fit xl:sticky xl:top-5">
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <h2 class="font-semibold text-highlighted">Usuarios</h2>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted">{{ users.length }} total</span>
                  <UButton size="xs" color="primary" icon="i-lucide-plus" @click="openCreateUserModal">
                    Crear
                  </UButton>
                  <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-pencil" :disabled="!selectedUser" @click="openEditUserModal">
                    Editar
                  </UButton>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <UInput v-model="userSearch" icon="i-lucide-search" placeholder="Buscar usuario..." />

              <div class="max-h-[570px] overflow-y-auto border border-default rounded-xl divide-y divide-default">
                <button
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="w-full text-left px-4 py-3.5 transition"
                  :class="selectedUserId === user.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-elevated'"
                  @click="selectedUserId = user.id"
                >
                  <p class="font-semibold text-sm text-highlighted truncate">{{ user.name }}</p>
                  <p class="text-xs text-muted truncate mt-1.5">{{ user.email }}</p>
                  <p class="text-[10px] text-muted mt-1.5 font-mono">{{ user.id }}</p>
                </button>

                <div v-if="filteredUsers.length === 0" class="p-4 text-sm text-muted">
                  No hay usuarios que coincidan.
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-semibold text-highlighted">Asignación de roles</h2>
                  <p class="text-xs text-muted mt-1">
                    Usuario: <span class="font-semibold">{{ selectedUser?.name || 'Ninguno' }}</span>
                  </p>
                </div>

                <UButton
                  color="primary"
                  icon="i-lucide-save"
                  :loading="isSavingUserRoles"
                  :disabled="!selectedUserId || isUserRolesLoading"
                  @click="saveUserRoles"
                >
                  Guardar roles
                </UButton>
              </div>
            </template>

            <div v-if="!selectedUserId" class="text-sm text-muted">
              Selecciona un usuario para asignar roles.
            </div>

            <div v-else class="grid grid-cols-1 2xl:grid-cols-2 gap-3">
              <label
                v-for="role in roles"
                :key="role.id"
                class="flex items-start gap-3 rounded-xl border border-default p-3.5 cursor-pointer hover:bg-elevated"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 mt-0.5"
                  :checked="userRoleIdsDraft.has(role.id)"
                  :disabled="isUserRolesLoading"
                  @change="toggleUserRole(role.id)"
                >

                <div>
                  <p class="font-semibold text-sm text-highlighted">{{ role.nombre }}</p>
                  <p class="text-xs text-muted mt-1.5 leading-relaxed">{{ role.descripcion || 'Sin descripción' }}</p>
                </div>
              </label>

              <div v-if="roles.length === 0" class="text-sm text-muted">
                No hay roles creados todavía.
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </div>

    <RoleFormModal
      v-model="roleModalOpen"
      :loading="isSavingRoleForm"
      :role="roleModalValue"
      @save="saveRole"
    />

    <ModuleRouteFormModal
      v-model="moduleRouteModalOpen"
      :loading="isSavingModuleRouteForm"
      :route="moduleRouteModalValue"
      @save="saveModuleRoute"
    />

    <UserFormModal
      v-model="userModalOpen"
      :loading="isSavingUserForm"
      :user="userModalValue"
      @save="saveUser"
    />
  </div>
</template>
