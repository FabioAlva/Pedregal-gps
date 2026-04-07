<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import useFilter from "../composables/useFilter";

const { selectedDevice, listDevice, endDate, startDate } = useFilter();
const isDark = computed(() => useColorMode().value === "dark");

defineProps<{
  onSearch: () => Promise<void> | void
  hideDeviceSelect?: boolean
}>();

const dpFormat = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
</script>
<template>
  <div class="flex flex-col lg:flex-row lg:items-center justify-start gap-4 px-5 py-3 lg:py-2.5 border-b border-default bg-default shrink-0">
    <div v-if="!hideDeviceSelect" class="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-muted">Unidad:</span>
      <USelect
        v-model="selectedDevice"
        :items="listDevice"
        class="w-full lg:w-44"
        size="sm"
        :ui="{ base: 'rounded-none font-sans text-[11px] font-medium uppercase tracking-wider' }"
      />
    </div>

    <div v-if="!hideDeviceSelect" class="hidden lg:block w-px h-5 bg-default shrink-0" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center gap-4 shrink-0">
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <span class="text-[10px] font-semibold uppercase tracking-widest text-muted">Desde:</span>
        <ClientOnly>
          <VueDatePicker
            v-model="startDate"
            :formats="{ input: dpFormat }"
            :auto-apply="true"
            :enable-time-picker="true"
            :dark="isDark"
            :teleport="true"
            class="w-full lg:w-52"
            @cleared="startDate = new Date(new Date().setHours(0, 0, 0, 0))"
          />
        </ClientOnly>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <span class="text-[10px] font-semibold uppercase tracking-widest text-muted">Hasta:</span>
        <ClientOnly>
          <VueDatePicker
            v-model="endDate"
            :formats="{ input: dpFormat }"
            :auto-apply="true"
            :enable-time-picker="true"
            :dark="isDark"
            :teleport="true"
            class="w-full lg:w-52"
            @cleared="endDate = new Date(new Date().setHours(23, 59, 59, 999))"
          />
        </ClientOnly>
      </div>
    </div>
    
    <UButton
      size="sm"
      label="Consultar"
      icon="i-lucide-search"
      loading-auto
      class="w-full lg:w-auto justify-center shrink-0 lg:ml-2 rounded-none"
      @click="onSearch"
    />
  </div>
</template>
<style>
body .dp__menu { z-index: 9999 !important; }
.dp__input {
  height: 30px !important;
  font-size: 0.75rem !important;
  line-height: 1.25rem !important;
  border-radius: 0 !important;
  font-family: var(--font-sans) !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
</style>