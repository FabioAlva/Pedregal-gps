<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from "@nuxt/ui";

interface Props {
  title: string;
  navItems: NavigationMenuItem[][];
}

const props = defineProps<Props>();
const route = useRoute();

const { user, logout, isAuthenticated, isLoggingOut } = await useAuthSession();
const userName = computed(
  () => user.value?.name || user.value?.email || "Usuario",
);
const userAvatar = computed(() => user.value?.image || undefined);

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: "Mi Perfil", icon: "i-lucide-user", to: "/profile" }],
  [
    {
      label: isLoggingOut.value ? "Cerrando sesión..." : "Cerrar sesión",
      icon: "i-lucide-log-out",
      disabled: isLoggingOut.value,
      onSelect: () => logout(),
    },
  ],
]);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar collapsible resizable :min-size="16" :default-size="18">
      <template #header="{ collapsed }">
        <div class="flex flex-col w-full">
          <div
            class="flex flex-col w-full bg-white z-90 mt-20 pb-6 min-h-[100px] justify-center"
            :class="[collapsed ? 'items-center px-2' : 'px-8 items-start']"
          >
            <div v-if="collapsed" class="flex flex-col items-center gap-4">
              <NuxtLink
                to="/"
                class="bg-brand-500 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center overflow-hidden shrink-0"
              >
                <img
                  src="/images/pedregal-Icon.png"
                  alt="P"
                  class="w-6 h-4 object-contain brightness-0 invert"
                />
              </NuxtLink>
              <UDashboardSidebarCollapse />
            </div>

            <template v-else>
              <div class="flex flex-row items-center w-full">
                <UDashboardSidebarCollapse class="-ml-3 mr-2" />
                <NuxtLink to="/" class="flex-1">
                  <img
                    src="/images/Logo-Pedregal-rojo-1.webp"
                    alt="Logo"
                    class="h-11 object-contain"
                  />
                </NuxtLink>
              </div>
              <div class="flex items-center gap-2 mt-4">
                <div class="h-px w-6 bg-brand-500/30" />
                <span
                  class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 leading-none"
                >
                  {{ title }}
                </span>
              </div>
            </template>
          </div>
          <div v-if="!collapsed" class="px-8 mb-2">
            <div class="h-[1px] w-full bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div :class="[collapsed ? '' : 'px-2']">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="navItems"
            orientation="vertical"
            variant="pill"
            class="space-y-1 mt-15 font-sans"
          />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div class="w-full border-t border-gray-100 dark:border-white/5 p-4">
          <UDropdownMenu
            :items="dropdownItems"
            :content="{ align: 'start', side: 'right', sideOffset: 12 }"
            class="w-full"
          >
            <UButton
              variant="ghost"
              color="neutral"
              block
              :class="[
                collapsed ? 'justify-center px-0' : 'justify-start px-3',
              ]"
            >
              <UChip
                position="bottom-right"
                inset
                :color="isAuthenticated ? 'success' : 'error'"
              >
                <UAvatar
                  :src="userAvatar"
                  :alt="userName"
                  size="sm"
                  class="ring-2 ring-brand-500/10"
                  :ui="{ root: 'rounded-sm' }"
                />
              </UChip>
              <div v-if="!collapsed" class="ml-3 text-left">
                <p
                  class="text-[9px] text-brand-500 font-black tracking-widest leading-none mt-0.5"
                >
                  Usuario
                </p>
                <p
                  class="text-xs font-bold truncate text-gray-900 dark:text-white uppercase tracking-tight"
                >
                  {{ userName }}
                </p>
              </div>
            </UButton>
          </UDropdownMenu>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="main-content">
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
