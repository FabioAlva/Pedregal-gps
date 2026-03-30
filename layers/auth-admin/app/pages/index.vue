<script setup lang="ts">
import { authClient } from "~~/layers/auth-admin/app/lib/auth-client";
const { data: session } = await authClient.useSession(useFetch);

if (session.value) {
    await navigateTo('/dashboard', { replace: true })
} else {
    await navigateTo('/login', { replace: true });
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary opacity-20" />
  </div>
</template>