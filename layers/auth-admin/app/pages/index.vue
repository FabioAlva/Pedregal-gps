<script setup lang="ts">
import { authClient } from "~~/layers/auth-admin/app/lib/auth-client";
import type { FrontPermissionPayload } from "~~/layers/auth-admin/app/utils/navigation-map";
import { canUserView, getNavigationMap } from "~~/layers/auth-admin/app/utils/navigation-map";

const { data: session, isPending } = await authClient.useSession(useFetch);
const permissionsState = useState<FrontPermissionPayload | null>("auth:my-permissions", () => null);

const resolveRedirect = async () => {
  console.log('[INDEX] session', session.value)
  if (!session.value) {
    console.log('[INDEX] no session, redirecting to /login')
    await navigateTo('/login', { replace: true });
    return;
  }

  if (!permissionsState.value) {
    console.log('[INDEX] fetching permissions')
    permissionsState.value = await $fetch<FrontPermissionPayload>("/api/auth/mis-permisos");
  }

  console.log('[INDEX] permissions keys', Object.keys(permissionsState.value?.routes ?? {}))
  if (import.meta.client) {
    localStorage.removeItem('app:navigation-map')
  }
  const map = await getNavigationMap();
  console.log('[INDEX] navigation map size', map.length)
  console.log('[INDEX] navigation map ids', map.map(route => route.id))
  const gpsRoute = map.find(route => route.url === '/gps')
  const preferred = gpsRoute && canUserView(permissionsState.value, gpsRoute.id)
    ? gpsRoute
    : map.find(route => canUserView(permissionsState.value, route.id));
  console.log('[INDEX] preferredRoute', preferred)

  await navigateTo(preferred?.url || '/login', { replace: true });
};

if (import.meta.client) {
  const didRedirect = ref(false);
  watchEffect(async () => {
    if (didRedirect.value || isPending.value) return;
    didRedirect.value = true;
    await resolveRedirect();
  });
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary opacity-20" />
  </div>
</template>