<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import useFilter from "../composables/useFilter";
import { storeToRefs } from "pinia";
import { useMapStore } from "../stores/useMapStore";
import { useReportStore } from "../stores/useReportStore";
import { useFleet } from "#layers/fleet-management/app/composable/useFleet";
import { useInspections } from "#layers/inspections/app/composables/useInspections";
import { useOperatorShifts } from "#layers/operators/app/composables/useOperatorShifts";
import { useReport } from "../composables/useReport";

const { selectedDevice, listDevice, endDate, startDate } = useFilter();
const isDark = computed(() => useColorMode().value === "dark");

const props = withDefaults(defineProps<{
  onSearch: () => Promise<void> | void
  hideDeviceSelect?: boolean
  onClose?: () => void
  variant?: "aside" | "inline"
  pageSize?: number
}>(), {
  variant: "aside",
  pageSize: 10
});

const searchQuery = ref("");
const currentPage = ref(1);
const showDetail = ref(false);
const isFetching = ref(false);
const latestShift = ref<any | null>(null);
const needsSearch = ref(false);

const mapStore = useMapStore();
const reportStore = useReportStore();
const { allRoutes } = storeToRefs(mapStore);
const { distanceRawData, speedRawData } = storeToRefs(reportStore);
const { fleets, fetchFleets } = useFleet();
const { inspections, fetchInspections } = useInspections();
const { shifts, fetchShifts } = useOperatorShifts();
const { fetchAllReports } = useReport();

const normalizedList = computed(() => listDevice.value);

const filteredDevices = computed(() => {
  if (!searchQuery.value) return normalizedList.value;
  const q = searchQuery.value.toLowerCase();
  return normalizedList.value.filter((item: any) => {
    const label = String(item?.label ?? item?.name ?? item?.placaAuto ?? item?.nombreGps ?? "").toLowerCase();
    return label.includes(q);
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredDevices.value.length / props.pageSize)));
const paginatedDevices = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return filteredDevices.value.slice(start, start + props.pageSize);
});

const selectedItem = computed(() =>
  listDevice.value.find((item: any) => String(item?.value) === String(selectedDevice.value))
);

const selectedLabel = computed(() =>
  selectedItem.value?.label || selectedItem.value?.name || selectedItem.value?.placaAuto || "Todos"
);

const selectedMeta = computed(() =>
  selectedItem.value?.nombreGps || selectedItem.value?.serie || "Unidad activa"
);

const selectedDriver = computed(() =>
  selectedItem.value?.conductor || selectedItem.value?.driverName || selectedItem.value?.nombreConductor || selectedItem.value?.chofer || "Sin asignar"
);

const selectedOperator = computed(() =>
  selectedItem.value?.operador || selectedItem.value?.operatorName || selectedItem.value?.nombreOperador || selectedItem.value?.empresa || "Sin operador"
);

const selectedPlaca = computed(() =>
  selectedItem.value?.placaAuto || selectedItem.value?.label || selectedItem.value?.name || "-"
);

const selectedFleet = computed(() =>
  fleets.value.find((fleet: any) => String(fleet?.placa) === String(selectedPlaca.value)) || null
);

const selectedMarca = computed(() =>
  selectedFleet.value?.marca || selectedFleet.value?.marcaId || "-"
);

const selectedStatus = computed(() => {
  if (selectedItem.value?.state === 1 || selectedItem.value?.status === "online" || selectedItem.value?.online === true) return "Online";
  return "Activo";
});

const selectedDeviceId = computed(() => String(selectedDevice.value || ""));
const routeData = computed(() => allRoutes.value[selectedDeviceId.value] ?? null);

const lastCoords = computed(() => {
  const last = routeData.value?.lastPoint;
  if (!last?.lat && !last?.lng) return "-";
  return `${last.lat.toFixed(5)}, ${last.lng.toFixed(5)}`;
});

const maxSpeedValue = computed(() => {
  const fromRoute = routeData.value?.maxSpeed;
  if (fromRoute != null) return fromRoute;
  const report = speedRawData.value[selectedDeviceId.value];
  return report?.maxSpeed ?? null;
});

const minSpeedValue = computed(() => {
  const points = routeData.value?.points || [];
  if (points.length) {
    const speeds = points.map(p => p.state?.reported?.sp ?? 0).filter((v: number) => Number.isFinite(v));
    return speeds.length ? Math.min(...speeds) : null;
  }
  const report = speedRawData.value[selectedDeviceId.value];
  if (report?.points?.length) {
    const speeds = report.points.map(p => p.state?.reported?.sp ?? 0).filter((v: number) => Number.isFinite(v));
    return speeds.length ? Math.min(...speeds) : null;
  }
  return null;
});

const distanceValue = computed(() => {
  const value = distanceRawData.value[selectedDeviceId.value];
  return value != null ? Number(value) : null;
});

const operatorName = computed(() => {
  if (latestShift.value?.operadorNombres || latestShift.value?.operadorApellidos) {
    return `${latestShift.value?.operadorNombres ?? ''} ${latestShift.value?.operadorApellidos ?? ''}`.trim();
  }
  return "Sin operador";
});

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
};

const shiftStart = computed(() => formatDateTime(latestShift.value?.fechaInicio));
const shiftEnd = computed(() => formatDateTime(latestShift.value?.fechaFin));

const lastInspection = computed(() => {
  const matches = inspections.value
    .filter((item: any) => String(item?.flotaPlaca) === String(selectedPlaca.value))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matches[0] || null;
});

const lastInspections = computed(() => {
  return inspections.value
    .filter((item: any) => String(item?.flotaPlaca) === String(selectedPlaca.value))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
});

const lastInspectionLabel = computed(() => {
  if (!lastInspection.value) return "-";
  const date = new Date(lastInspection.value.createdAt);
  const dateStr = Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-PE");
  return `${dateStr} · ${lastInspection.value.estado ?? ''}`.trim();
});

const selectDevice = (item: any) => {
  const id = String(item?.value ?? item?.idGps ?? item?.id ?? "");
  if (!id) return;
  selectedDevice.value = id;
  showDetail.value = id !== "all";
};

const goBackToList = () => {
  showDetail.value = false;
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(filteredDevices, () => {
  if (currentPage.value > pageCount.value) currentPage.value = pageCount.value;
});

watch(selectedDevice, async (value) => {
  if (!value || value === "all") {
    latestShift.value = null;
    showDetail.value = false;
    needsSearch.value = false;
    if (value === "all") {
      isFetching.value = true;
      try {
        await props.onSearch?.();
      } finally {
        isFetching.value = false;
      }
    }
    return;
  }
  isFetching.value = true;
  try {
    await Promise.all([
      fetchFleets(),
      fetchInspections(),
      fetchShifts()
    ]);
    const matches = shifts.value
      .filter((item: any) => String(item?.placa) === String(selectedPlaca.value))
      .sort((a: any, b: any) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
    latestShift.value = matches[0] || null;
  } finally {
    isFetching.value = false;
  }
  needsSearch.value = true;
});

watch([startDate, endDate], async () => {
  if (!selectedDevice.value) return;
  if (selectedDevice.value === "all") {
    isFetching.value = true;
    try {
      await props.onSearch?.();
    } finally {
      isFetching.value = false;
    }
    return;
  }
  needsSearch.value = true;
});

const runSearch = async () => {
  if (!selectedDevice.value) return;
  isFetching.value = true;
  try {
    if (selectedDevice.value !== "all") {
      await fetchAllReports({ showValidationMessage: false });
    }
    await props.onSearch?.();
  } finally {
    isFetching.value = false;
  }
  if (selectedDevice.value !== "all") {
    needsSearch.value = false;
  }
};

const dpFormat = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
</script>
<template>
  <aside
    v-if="variant === 'aside'"
    class="w-[360px] h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative"
  >
    <div
      v-if="isFetching"
      class="absolute inset-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest">
        Cargando...
      </div>
    </div>
    <div class="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div class="flex items-start justify-between gap-3">
        <h2 class="font-serif text-4xl font-bold tracking-tighter text-primary leading-none">Filtros</h2>
        <UButton
          v-if="onClose"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          :title="'Cerrar filtros'"
          class="mt-1 rounded-none"
          @click="onClose?.()"
        />
      </div>
    </div>

    <div class="px-5 py-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
      <div class="space-y-2">
        <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Desde</span>
        <ClientOnly>
          <VueDatePicker
            v-model="startDate"
            :formats="{ input: dpFormat }"
            :auto-apply="true"
            :enable-time-picker="true"
            :dark="isDark"
            :teleport="true"
            class="w-full samsara-datepicker"
            @cleared="startDate = new Date(new Date().setHours(0, 0, 0, 0))"
          />
        </ClientOnly>
      </div>

      <div class="space-y-2">
        <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Hasta</span>
        <ClientOnly>
          <VueDatePicker
            v-model="endDate"
            :formats="{ input: dpFormat }"
            :auto-apply="true"
            :enable-time-picker="true"
            :dark="isDark"
            :teleport="true"
            class="w-full samsara-datepicker"
            @cleared="endDate = new Date(new Date().setHours(23, 59, 59, 999))"
          />
        </ClientOnly>
      </div>

    </div>

    <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
      <div v-if="!hideDeviceSelect" class="space-y-3">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Buscar por placa o GPS"
          size="sm"
          :ui="{ rounded: 'rounded-none', icon: { base: 'text-slate-400' } }"
        />
      </div>
    </div>

    <div v-if="!hideDeviceSelect && !showDetail" class="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
      <div
        v-for="item in paginatedDevices"
        :key="item.value || item.idGps || item.id"
        @click="selectDevice(item)"
        :class="[
          'p-3 rounded-none border transition-all cursor-pointer',
          String(selectedDevice) === String(item.value)
            ? 'bg-blue-50 border-blue-200 shadow-sm dark:bg-blue-950/40 dark:border-blue-900'
            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad</p>
            <p class="text-sm font-black text-slate-900 dark:text-white uppercase">
              {{ item.label || item.name || item.placaAuto || item.nombreGps || 'Unidad' }}
            </p>
            <p class="text-[11px] text-slate-500 truncate">{{ item.nombreGps || item.serie || 'GPS activo' }}</p>
          </div>
          <span
            v-if="item.state === 1"
            class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-green-100 text-green-700"
          >
            Online
          </span>
        </div>
      </div>

      <div v-if="!filteredDevices.length" class="text-center text-xs text-slate-500 py-6">
        No se encontraron unidades.
      </div>
    </div>

    <div v-if="!hideDeviceSelect && showDetail" class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 pb-6">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          :title="'Volver a unidades'"
          class="rounded-none"
          @click="goBackToList"
        />
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalle</p>
          <p class="text-sm font-black uppercase text-slate-900 dark:text-white">{{ selectedLabel }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <p v-if="needsSearch" class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          Cambios pendientes, presiona Visualizar.
        </p>
        <UButton
          size="xs"
          label="Visualizar"
          icon="i-lucide-eye"
          class="rounded-none ml-auto"
          :disabled="isFetching"
          @click="runSearch"
        />
      </div>

      <details open class="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70">
        <summary class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">Info del carro</summary>
        <div class="px-4 pb-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Placa</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ selectedPlaca }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Marca</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ selectedMarca }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">GPS</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ selectedMeta }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Posicion</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{{ lastCoords }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ selectedStatus }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Vel</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ maxSpeedValue ?? '-' }} km/h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Vel</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ minSpeedValue ?? '-' }} km/h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Km</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ distanceValue ?? '-' }}</span>
          </div>
        </div>
      </details>

      <details class="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70">
        <summary class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">Info del operador</summary>
        <div class="px-4 pb-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Operador</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{{ operatorName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignacion</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ shiftStart }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fin</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ shiftEnd }}</span>
          </div>
        </div>
      </details>

      <details class="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70">
        <summary class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">Ultimas inspecciones</summary>
        <div class="px-4 pb-4 space-y-3">
          <div v-if="!lastInspections.length" class="text-xs text-slate-500">Sin inspecciones.</div>
          <div v-else class="space-y-2">
            <div v-for="item in lastInspections" :key="item.id" class="flex items-center justify-between text-xs">
              <span class="text-slate-500">{{ new Date(item.createdAt).toLocaleDateString('es-PE') }}</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ item.estado }}</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {{ lastInspectionLabel }}
          </div>
        </div>
      </details>
    </div>

    <div v-if="!hideDeviceSelect && !showDetail" class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-chevron-left"
        :disabled="currentPage <= 1"
        class="rounded-none"
        @click="currentPage = Math.max(1, currentPage - 1)"
      />
      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Pagina {{ currentPage }} / {{ pageCount }}
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-chevron-right"
        :disabled="currentPage >= pageCount"
        class="rounded-none"
        @click="currentPage = Math.min(pageCount, currentPage + 1)"
      />
    </div>
  </aside>

  <div v-else class="flex flex-col lg:flex-row lg:items-center justify-start gap-4 px-5 py-3 lg:py-2.5 border-b border-default bg-default shrink-0">
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
      @click="runSearch"
    />
  </div>
</template>
<style>
body .dp__menu { z-index: 9999 !important; }
.samsara-datepicker .dp__input {
  height: 34px !important;
  font-size: 0.75rem !important;
  line-height: 1.25rem !important;
  border-radius: 0 !important;
  font-family: var(--font-sans) !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  border: 1px solid #e2e8f0 !important;
}
.dark .samsara-datepicker .dp__input {
  border-color: #1f2937 !important;
  background-color: #0f172a !important;
  color: #f8fafc !important;
}
</style>