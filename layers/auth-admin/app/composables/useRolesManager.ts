// layers/auth-admin/app/composables/useRolesManager.ts
import type { RoleRoutePermissionView } from "#layers/auth-admin/server/Repository/Interfaces/IRoleRepository";
import type { Role , ModuleRoute } from '~~/shared/types/db'
import { useModuleStore } from "../stores/useModuleStore";
import { useRoleStore } from "../stores/useRoleStore";


  export const useRolesManager = () => {
  const toast = useToast();
  
  // RECURSOS DE STORES
  const moduleStore = useModuleStore()
  const roleStore = useRoleStore()
  
  // Referencias reactivas de los stores
  const { roles } = storeToRefs(roleStore)
  const { routes: moduleRoutes } = storeToRefs(moduleStore)

  // Estados locales del composable
  const isBootLoading = ref(false)
  const isSaving = ref(false)
  const isCreatingRole = ref(false)
  const selectedRoleId = ref<number>()
  const roleRoutePermissionsDraft = ref<Record<number, any>>({})

  // CARGA DE DATOS BASE (Reciclando lógica)
  const loadBaseData = async () => {
    isBootLoading.value = true
    try {
      await Promise.all([
        roleStore.fetchRoles(),
        moduleStore.fetchRoutes() 
      ])
    } catch (error: any) {
      toast.add({ title: "Error", description: "Error al cargar datos base", color: "error" })
    } finally {
      isBootLoading.value = false
    }
  }

  // MÉTODO PARA CREAR ROL 
  const createRole = async (formData: any) => {
    isCreatingRole.value = true
    try {
      const res = await $fetch<Role>("/api/roles", {
        method: "POST",
        body: formData
      })
      const newRoleFull = { ...formData, ...res }
      roleStore.addRole(newRoleFull)
      toast.add({ title: "Éxito", description: "Rol creado", color: "success" })
      return newRoleFull
    } catch (e: any) {
      toast.add({ title: "Error", description: "No se pudo crear el rol", color: "error" })
    } finally {
      isCreatingRole.value = false
    }
  }
  
  /* Carga permisos por ruta por id de rol seleccionado */
  const loadRolePermissions = async (id: number) => {
    try {
      const rows = await $fetch<RoleRoutePermissionView[]>(
        `/api/roles/${id}/route-permissions`,
      );
      const next: Record<number, any> = {};
      moduleRoutes.value.forEach((route) => {
        const permission = rows.find((r) => r.rutaModuloId === route.id);
        next[route.id] = {
          ver: Boolean(permission?.ver),
          agregar: Boolean(permission?.agregar),
          editar: Boolean(permission?.editar),
          eliminar: Boolean(permission?.eliminar),
        };
      });
      roleRoutePermissionsDraft.value = next;
    } catch (e) {
      toast.add({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        color: "error",
      });
    }
  };

  /*Guarda los cambios en los permisos por ruta */
  const saveRolePermissions = async () => {
    /*Si no hay rol seleccionado no retorna nada */
    if (!selectedRoleId.value) return;
    isSaving.value = true;
    /* Mapea de lo que vino de la api */
    const permissions = moduleRoutes.value.map((route) => {
      const d = roleRoutePermissionsDraft.value[route.id] || {
        ver: false,
        agregar: false,
        editar: false,
        eliminar: false,
      };
      return {
        rutaModuloId: route.id,
        ver: Boolean(d.ver),
        agregar: Boolean(d.agregar),
        editar: Boolean(d.editar),
        eliminar: Boolean(d.eliminar),
      };    
    });

    try {

      /* Eliminamos los permisos anteriores y seteamos los nuevos */
      await $fetch(`/api/roles/${selectedRoleId.value}/route-permissions`, {
        method: "PUT",
        body: { permissions },
      });
      
      toast.add({
        title: "Éxito",
        description: "Permisos actualizados en DB",
        color: "success",
      });
      // Recargamos para confirmar que lo que hay en la DB es lo que vemos
      await Promise.all([
        loadRolePermissions(selectedRoleId.value),
        // refrescamos nuestros permisos en usestate 
        refreshMyPermissions(),
      ]);
    } catch (e: any) {
      toast.add({
        title: "Error",
        description: e.statusMessage || "Error al guardar",
        color: "error",
      });
    } finally {
      isSaving.value = false;
    }
  };
  
 /* Refresca los permisos del usuario actual , en el useState */
  const refreshMyPermissions = async () => {
    const permissionsState = useState("auth:my-permissions");
    try {
      const freshPermissions = await $fetch("/api/auth/mis-permisos");
      permissionsState.value = freshPermissions;
    }
    catch (err) {
      console.error("Error:No se pudo sincronizar los permisos en el localstorage", err);
    }
  };

 return {
    roles,
    moduleRoutes,
    isBootLoading,
    isSaving,
    isCreatingRole,
    selectedRoleId,
    roleRoutePermissionsDraft,
    loadBaseData,
    loadRolePermissions,
    saveRolePermissions,
    createRole 
  }
};
