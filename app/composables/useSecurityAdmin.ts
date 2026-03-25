import { ref, computed } from 'vue'

export const useSecurityManager = () => {
  const toast = useToast()
  const roles = ref<any[]>([])
  const moduleRoutes = ref<any[]>([])
  const users = ref<any[]>([])
  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isActionLoading = ref(false)
  const selectedRoleId = ref<number | undefined>()
  const selectedUserId = ref<string | null>(null)
  const selectedModuleRouteId = ref<number | undefined>()

  const roleRoutePermissionsDraft = ref<Record<number, any>>({})
  const userRoleIdsDraft = ref<Set<number>>(new Set())
  const relatedRouteIdsDraft = ref<Set<number>>(new Set())

  const loadAll = async () => {
    isBootLoading.value = true
    try {
      const [r, u, m] = await Promise.all([
        $fetch<any[]>('/api/roles'),
        $fetch<any[]>('/api/users'),
        $fetch<any[]>('/api/module-routes')
      ])
      roles.value = r; users.value = u; moduleRoutes.value = m
    } finally { isBootLoading.value = false }
  }

  const loadRolePermissions = async (id: number) => {
    isActionLoading.value = true
    try {
      const rows = await $fetch<any[]>(`/api/roles/${id}/route-permissions`)
      const next: Record<number, any> = {}
      
      // INICIALIZAMOS TODAS LAS RUTAS (Frontend y Backend) para no perder ninguna
      moduleRoutes.value.forEach(route => {
        const p = rows.find(r => r.rutaModuloId === route.id)
        next[route.id] = { 
          ver: !!p?.ver, 
          agregar: !!p?.agregar, 
          editar: !!p?.editar, 
          eliminar: !!p?.eliminar 
        }
      })
      roleRoutePermissionsDraft.value = next
    } finally { isActionLoading.value = false }
  }

 const saveRolePermissions = async () => {
  if (!selectedRoleId.value) return
  isSaving.value = true

  // USAMOS moduleRoutes como base para asegurar que enviamos las 49 filas siempre
  const permissions = moduleRoutes.value.map(route => {
    // Si la ruta existe en el borrador, usamos sus valores. 
    // Si no existe (porque nunca se clickeó), mandamos false por defecto.
    const flags = roleRoutePermissionsDraft.value[route.id] || { 
      ver: false, agregar: false, editar: false, eliminar: false 
    }

    return {
      rutaModuloId: Number(route.id),
      ver: !!flags.ver,
      agregar: !!flags.agregar,
      editar: !!flags.editar,
      eliminar: !!flags.eliminar
    }
  })

  // LOG DE SEGURIDAD: Verifica que el array tenga 49 elementos
  console.log(`🚀 [FRONTEND] Enviando ${permissions.length} rutas al backend.`);

  try {
    await $fetch(`/api/roles/${selectedRoleId.value}/route-permissions`, {
      method: 'PUT',
      body: { permissions }
    })
    toast.add({ title: 'Éxito', description: 'Permisos sincronizados correctamente.', color: 'success' })
    
    // Recargamos para limpiar cualquier inconsistencia visual
    await loadRolePermissions(selectedRoleId.value)
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.statusMessage, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

  // --- RUTAS RELACIONADAS (Frontend <-> Backend) ---
  const loadRelatedRoutes = async (routeId: number) => {
    isActionLoading.value = true
    try {
      const res = await $fetch<any>(`/api/module-routes/${routeId}/related-routes`)
      relatedRouteIdsDraft.value = new Set(res.relatedRouteIds || [])
    } finally { isActionLoading.value = false }
  }

  const saveRelatedRoutes = async () => {
    if (!selectedModuleRouteId.value) return
    isSaving.value = true
    try {
      await $fetch(`/api/module-routes/${selectedModuleRouteId.value}/related-routes`, {
        method: 'PUT',
        body: { relatedRouteIds: Array.from(relatedRouteIdsDraft.value) }
      })
      toast.add({ title: 'Relaciones guardadas', color: 'success' })
    } finally { isSaving.value = false }
  }

  // --- ROLES DE USUARIO ---
  const loadUserRoles = async (uid: string) => {
    isActionLoading.value = true
    try {
      const rows = await $fetch<any[]>(`/api/users/${uid}/roles`)
      userRoleIdsDraft.value = new Set(rows.map(r => r.rolId))
    } finally { isActionLoading.value = false }
  }

  const saveUserRoles = async () => {
    if (!selectedUserId.value) return
    isSaving.value = true
    try {
      await $fetch(`/api/users/${selectedUserId.value}/roles`, {
        method: 'PUT',
        body: { roleIds: Array.from(userRoleIdsDraft.value) }
      })
      toast.add({ title: 'Roles de usuario actualizados', color: 'success' })
    } finally { isSaving.value = false }
  }

  return {
    roles, moduleRoutes, users, isBootLoading, isSaving, isActionLoading,
    selectedRoleId, selectedUserId, selectedModuleRouteId,
    roleRoutePermissionsDraft, userRoleIdsDraft, relatedRouteIdsDraft,
    loadAll, loadRolePermissions, saveRolePermissions,
    loadRelatedRoutes, saveRelatedRoutes,
    loadUserRoles, saveUserRoles
  }
}