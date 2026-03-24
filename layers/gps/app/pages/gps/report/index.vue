<script setup lang="ts">
import { onMounted, computed } from "vue";
import FilterComponent from "#layers/gps/app/components/FilterComponent.vue";
import useFilter from "#layers/gps/app/composables/useFilter";
import { useReport } from "#layers/gps/app/composables/useReport";

const colorMode = useColorMode();
const theme = computed(() => (colorMode.value === "dark" ? "dark" : "default"));
provide(THEME_KEY, theme);

const areaH = ref(350);
const chartH = ref(260);

const {
  speedOption,
  stopOption,
  distanceOption,
  speedChartData,
  stopChartData,
  distanceChartData,
  speedStats,
  reportErrorMessage,
  fetchAllReports,
} = useReport();

const { fetchDevices } = useFilter();

onMounted(async () => {
  if (window.innerWidth < 1600) {
    areaH.value = 200;
    chartH.value = 150;
  }

  await fetchDevices();
  await fetchAllReports({ showValidationMessage: false });
});
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <div class="shrink-0 border-b border-default">
      <FilterComponent :on-search="fetchAllReports" />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="p-5 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5"
            >
              Reportes GPS
            </p>
            <h1 class="text-xl font-bold text-highlighted">
              Análisis de Flota
            </h1>
          </div>
        </div>

        <UAlert
          v-if="reportErrorMessage"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="reportErrorMessage"
        />

        <div
          v-if="speedStats.length"
          class="grid grid-cols-2 md:grid-cols-4 gap-2"
        >
          <div
            v-for="stat in speedStats"
            :key="stat.id"
            class="rounded-lg border border-default bg-elevated p-3 flex items-center gap-3"
          >
            <div
              class="w-2 h-10 rounded-full shrink-0"
              :style="{ background: stat.color }"
            />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-highlighted truncate">
                {{ stat.name }}
              </p>
              <p class="text-xs text-muted">
                Máx
                <span class="text-primary font-mono font-semibold">{{
                  stat.maxSpeed
                }}</span>
                km/h · Prom
                <span class="text-success font-mono font-semibold">{{
                  stat.avgSpeed
                }}</span>
                km/h
              </p>
            </div>
          </div>
        </div>

        <!-- Charts grid -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Speed trend -->
          <UCard class="col-span-3">
            <template #header>
              <div class="flex w-full justify-between items-center gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-primary" />
                  <span class="text-sm font-semibold text-highlighted"
                    >Tendencia de velocidad</span
                  >
                </div>
                <div
                  class="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
                >
                  <UIcon
                    name="i-heroicons-magnifying-glass-plus-20-solid"
                    class="w-4 h-4 text-primary"
                  />
                  <span class="text-xs font-semibold text-primary"
                    >Scroll para zoom</span
                  >
                </div>
              </div>
            </template>
            <ClientOnly>
              <VChart
                v-if="speedChartData.data.length"
                :option="speedOption"
                :style="{ height: `${areaH}px` }"
                autoresize
              />
              <div
                v-else
                class="flex items-center justify-center text-muted text-sm"
                :style="{ height: `${areaH}px` }"
              >
                Sin datos para el período seleccionado
              </div>
              <template #fallback>
                <USkeleton
                  :style="{ height: `${areaH}px` }"
                  class="w-full rounded-lg"
                />
              </template>
            </ClientOnly>
          </UCard>

          <!-- Stop hours -->
          <UCard class="col-span-3 md:col-span-1">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-error" />
                <span class="text-sm font-semibold text-highlighted"
                  >Horas paradas acumuladas</span
                >
              </div>
            </template>
            <ClientOnly>
              <VChart
                v-if="stopChartData.data.length"
                :option="stopOption"
                :style="{ height: `${chartH}px` }"
                autoresize
              />
              <div
                v-else
                class="flex items-center justify-center text-muted text-sm"
                :style="{ height: `${chartH}px` }"
              >
                Sin datos
              </div>
              <template #fallback>
                <USkeleton
                  :style="{ height: `${chartH}px` }"
                  class="w-full rounded-lg"
                />
              </template>
            </ClientOnly>
          </UCard>

          <!-- Distance -->
          <UCard class="col-span-3 md:col-span-2">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-success" />
                <span class="text-sm font-semibold text-highlighted"
                  >Kilometraje acumulado</span
                >
              </div>
            </template>
            <ClientOnly>
              <VChart
                v-if="distanceChartData.data.length"
                :option="distanceOption"
                :style="{ height: `${chartH}px` }"
                autoresize
              />
              <div
                v-else
                class="flex items-center justify-center text-muted text-sm"
                :style="{ height: `${chartH}px` }"
              >
                Sin datos
              </div>
              <template #fallback>
                <USkeleton
                  :style="{ height: `${chartH}px` }"
                  class="w-full rounded-lg"
                />
              </template>
            </ClientOnly>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
