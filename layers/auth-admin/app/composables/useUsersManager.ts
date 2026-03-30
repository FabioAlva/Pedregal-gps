// layers/auth-admin/app/composables/useUsersManager.ts
import { useUserStore } from "../stores/useUserStore";
import { useRoleStore } from "../stores/useRoleStore";
import { storeToRefs } from "pinia";

export const useUsersManager = () => {
  const toast = useToast();

  // RECURSOS DE STORES
  const userStore = useUserStore();
  const roleStore = useRoleStore();

  // Referencias reactivas
  const { users } = storeToRefs(userStore);
  const { roles } = storeToRefs(roleStore);

  // Estados locales
  const isBootLoading = ref(false);     // Carga inicial de la lista
  const isCreatingUser = ref(false);        // POST /api/users
  const isUpdating = ref(false);        // PATCH /api/users/:id
  const isSyncingRoles = ref(false);    // PUT /api/users/:id/roles  const isCreatingUser = ref(false);
  const selectedUserId = ref<string | null>(null);
  const userRoleIdsDraft = ref<Set<number>>(new Set());

  // CARGA DE DATOS BASE o Storeo en cache (Reutilizando lógica de RolesManager)
  const loadUsersAndRoles = async () => {
    isBootLoading.value = true;
    try {
      await Promise.all([
        userStore.fetchUsers(),
        roleStore.fetchRoles() // Si ya se cargó en RolesManager, fetchRoles no hará nada (eficiencia)
      ]);
    } catch (error: any) {
      toast.add({ title: "Error", description: "Fallo al cargar directorio", color: "error" });
    } finally {
      isBootLoading.value = false;
    }
  };

  // CARGA DE ROLES ESPECÍFICOS DE UN USUARIO
  const loadUserRoles = async (uid: string) => {
    try {
      const rows = await $fetch<any[]>(`/api/users/${uid}/roles`);
      userRoleIdsDraft.value = new Set(rows.map((r) => r.rolId));
    } catch (e) {
      toast.add({ title: "Error", description: "No se pudieron cargar los roles del usuario", color: "error" });
    }
  };

  // MÉTODO PARA CREAR USUARIO (Estrategia de Merge)
  const createUser = async (formData: any) => {
    isCreatingUser.value = true;
    try {
      const res = await $fetch<any>("/api/users", {
        method: "POST",
        body: formData,
      });
      const newUserFull = { ...formData, ...res };
      userStore.addUser(newUserFull);
      toast.add({ title: "Éxito", description: "Usuario creado correctamente", color: "success" });
      return newUserFull;
    } catch (e: any) {
      toast.add({ title: "Error", description: e.statusMessage || "Fallo al crear usuario", color: "error" });
    } finally {
      isCreatingUser.value = false;
    }
  };

  // Añadir al composable
const updateUser = async (id: string, formData: any) => {
  isUpdating.value = true;
  try {
    await $fetch(`/api/users/${id}`, { method: "PATCH", body: formData });
    await userStore.fetchUsers(); // Refresca la lista
    toast.add({ title: "Éxito", description: "Usuario actualizado" });
  } catch (e) {
    toast.add({ title: "Error", description: "Fallo al actualizar", color: "error" });
  } finally {
    isUpdating.value = false;
  }
};

  // GUARDAR ASIGNACIÓN DE ROLES
  const saveUserRoles = async () => {
    if (!selectedUserId.value) return;
    isSyncingRoles.value = true;
    try {
      await $fetch(`/api/users/${selectedUserId.value}/roles`, {
        method: "PUT",
        body: { roleIds: Array.from(userRoleIdsDraft.value) },
      });
      toast.add({ title: "Éxito", description: "Privilegios actualizados", color: "success" });
    } catch (e: any) {
      toast.add({ title: "Error", description: "Fallo al sincronizar roles", color: "error" });
    } finally {
      isSyncingRoles.value = false;
    }
  };

  return {
    users,
    roles,
    isBootLoading,
    isCreatingUser,
    isUpdating,
    isSyncingRoles,
    selectedUserId,
    userRoleIdsDraft,
    loadUsersAndRoles,
    loadUserRoles,
    updateUser,
    saveUserRoles,
    createUser
  };
};