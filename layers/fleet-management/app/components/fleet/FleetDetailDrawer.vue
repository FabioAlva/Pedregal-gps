<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import { useReport } from '#layers/gps/app/composables/useReport'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useReportStore } from '#layers/gps/app/stores/useReportStore'
import { useExpenses } from '#layers/expenses/app/composables/useExpenses'
import { useExpenseCategories } from '#layers/expenses/app/composables/useExpenseCategories'

const props = defineProps<{
  modelValue: boolean
  vehicle: any | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('overview')
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'i-lucide-layout-dashboard' },
  { id: 'telemetry', label: 'Telemetria & GPS', icon: 'i-lucide-satellite' },
  { id: 'fuel', label: 'Combustible', icon: 'i-lucide-fuel' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'i-lucide-wrench' },
  { id: 'docs', label: 'Documentos', icon: 'i-lucide-file-text' },
  { id: 'expenses', label: 'Gastos', icon: 'i-lucide-pie-chart' }
]

const {
  speedOption,
  speedChartData,
  reportErrorMessage,
  isReportLoading,
  fetchAllReports
} = useReport()

const { selectedDevice, listDevice, startDate, endDate, initDates, fetchDevices } = useFilter()
const isLoadingReport = ref(false)
const reportStore = useReportStore()
const { expenses, isLoading: isExpensesLoading, fetchExpenses } = useExpenses()
const { categories, isLoading: isCategoriesLoading, fetchCategories } = useExpenseCategories()

const setDeviceFromVehicle = () => {
  if (!props.vehicle) return
  const match = listDevice.value.find(device =>
    device.label === props.vehicle.placa || device.name === props.vehicle.placa
  )
  if (match?.value) {
    selectedDevice.value = match.value
    return true
  }
  selectedDevice.value = 'undefined'
  return false
}

const loadReport = async () => {
  if (!props.vehicle) return
  isLoadingReport.value = true
  try {
    reportStore.distanceRawData = {}
    reportStore.speedRawData = {}
    reportStore.stopRawData = {}
    initDates()
    await fetchDevices({ force: true })
    const hasDevice = setDeviceFromVehicle()
    if (!hasDevice) {
      reportErrorMessage.value = 'Unidad sin GPS asociado'
      return
    }
    await fetchAllReports({ showValidationMessage: false, force: true })
  } finally {
    isLoadingReport.value = false
  }
}

const loadFuel = async () => {
  await Promise.all([fetchExpenses(), fetchCategories()])
}

const activeDeviceId = computed(() => {
  if (!selectedDevice.value || selectedDevice.value === 'all' || selectedDevice.value === 'undefined') return null
  return selectedDevice.value
})

const activeSpeedReport = computed(() => {
  if (!activeDeviceId.value) return null
  return reportStore.speedRawData[activeDeviceId.value] ?? null
})

const activeDistance = computed(() => {
  if (!activeDeviceId.value) return null
  return reportStore.distanceRawData[activeDeviceId.value] ?? null
})

const speedMetrics = computed(() => {
  const report = activeSpeedReport.value
  if (!report?.points?.length) return null
  const speeds = report.points.map(point => point.state?.reported?.sp ?? 0)
  const min = Math.min(...speeds)
  const max = Math.max(...speeds)
  const avg = report.avgSpeed
  return { min, max, avg }
})

const hasGpsData = computed(() => !reportErrorMessage.value)

const fuelCategories = computed(() => categories.value.filter(category => category.esCombustible))
const fuelCategoryIds = computed(() => new Set(fuelCategories.value.map(category => category.id)))

const fuelExpenses = computed(() => {
  if (!props.vehicle) return []
  return expenses.value
    .filter(expense => expense.flotaId === props.vehicle.id)
    .filter(expense => fuelCategoryIds.value.has(expense.categoriaId))
})

const fuelDailyTotals = computed(() => {
  const totals = new Map<string, number>()
  const start = startDate.value ? new Date(startDate.value) : null
  const end = endDate.value ? new Date(endDate.value) : null
  const isInRange = (value: Date) => {
    if (!start || !end) return true
    return value >= start && value <= end
  }
  fuelExpenses.value.forEach(expense => {
    const date = expense.fecha ? new Date(expense.fecha) : null
    const label = date ? date.toLocaleDateString('es-PE') : 'Sin fecha'
    if (date && !isInRange(date)) return
    totals.set(label, (totals.get(label) ?? 0) + Number(expense.monto ?? 0))
  })
  return Array.from(totals.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => {
      const aDate = a.label === 'Sin fecha' ? 0 : new Date(a.label).getTime()
      const bDate = b.label === 'Sin fecha' ? 0 : new Date(b.label).getTime()
      return bDate - aDate
    })
})

const fuelSummary = computed(() => {
  if (!fuelDailyTotals.value.length) return null
  const total = fuelDailyTotals.value.reduce((acc, item) => acc + item.total, 0)
  const avg = total / fuelDailyTotals.value.length
  return { total, avg, days: fuelDailyTotals.value.length }
})

const fuelChartOption = computed(() => {
  if (!fuelDailyTotals.value.length) return {}
  const lastTen = fuelDailyTotals.value.slice(0, 10).reverse()
  return {
    grid: { left: 16, right: 16, top: 8, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: lastTen.map(item => item.label),
      axisLabel: { color: 'var(--ui-text-muted)', fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'var(--ui-border)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'var(--ui-text-muted)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--ui-border)' } }
    },
    series: [{
      type: 'bar',
      data: lastTen.map(item => Number(item.total.toFixed(2))),
      itemStyle: { color: 'var(--ui-primary)' },
      barMaxWidth: 28
    }]
  }
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      activeTab.value = 'overview'
      loadReport()
      loadFuel()
    }
  }
)

watch(
  () => props.vehicle,
  () => {
    if (props.modelValue) {
      loadReport()
      loadFuel()
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    loadReport()
    loadFuel()
  }
})
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen && vehicle" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="isOpen = false" />

      <div class="relative w-full max-w-[85%] h-full bg-white shadow-2xl flex flex-col">
        <div class="bg-slate-950 p-12 text-white shrink-0 relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-brand-500/10 blur-[120px] rounded-full" />

          <div class="relative z-10 flex justify-between items-start">
            <div class="flex gap-10 items-center">
              <img
                v-if="vehicle.urlFotoUnidad"
                :src="vehicle.urlFotoUnidad"
                class="w-40 h-40 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
              />
              <div>
                <h2 class="font-sans text-6xl font-black leading-none tracking-tighter uppercase">
                  {{ vehicle.placa }}
                </h2>
                <div class="flex items-center gap-3 mt-2">
                  <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ vehicle.id }}</span>
                  <span class="text-slate-400 text-xs font-mono uppercase tracking-tight">{{ vehicle.marca }} {{ vehicle.modelo }}</span>
                </div>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="white" variant="ghost" size="xl" @click="isOpen = false" />
          </div>
        </div>

        <div class="bg-white px-12 border-b border-slate-100 flex gap-10 shrink-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative"
            :class="activeTab === tab.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-800'"
          >
            <span class="flex items-center gap-2"><UIcon :name="tab.icon" class="w-4 h-4" /> {{ tab.label }}</span>
            <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-1 bg-brand-500 animate-in fade-in zoom-in duration-300" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-12 bg-slate-50/50 custom-scrollbar">
          <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div class="space-y-6">
              <h3 class="font-serif text-2xl font-bold text-slate-900">Especificaciones Base</h3>
              <div class="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div
                  v-for="(val, label) in { 'Año': vehicle.anho, 'Marca': vehicle.marca, 'Modelo': vehicle.modelo, 'Estado': vehicle.estado }"
                  class="flex justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ label }}</span>
                  <span class="text-sm font-bold text-slate-800 uppercase">{{ val }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <h3 class="font-serif text-2xl font-bold text-slate-900">Documentacion</h3>
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <UButton v-if="vehicle.urlSoatPdf" icon="i-lucide-file-text" label="Ver SOAT (PDF)" block color="slate" variant="subtle" />
                <UButton v-if="vehicle.urlTecnicaPdf" icon="i-lucide-file-text" label="Revision Tecnica (PDF)" block color="slate" variant="subtle" />
                <p v-if="!vehicle.urlSoatPdf && !vehicle.urlTecnicaPdf" class="text-xs text-slate-400 italic text-center py-4">No hay documentos adjuntos</p>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'telemetry'" class="space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 class="font-serif text-2xl font-bold text-slate-900">Reporte GPS por unidad</h3>
                <p class="text-xs text-slate-500 mt-1">
                  {{ vehicle?.placa || 'Unidad seleccionada' }} · Telemetria de velocidad, paradas y distancia.
                </p>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <FilterComponent :on-search="loadReport" :hide-device-select="true" />
            </div>

            <UAlert
              v-if="reportErrorMessage"
              color="error"
              variant="soft"
              icon="i-lucide-circle-alert"
              :description="reportErrorMessage"
            />

            <div v-if="hasGpsData" class="grid grid-cols-1 gap-4">
              <UCard>
                <template #header>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary" />
                    <span class="text-sm font-semibold text-highlighted">Tendencia de velocidad</span>
                  </div>
                </template>
                <ClientOnly>
                  <VChart
                    v-if="speedChartData.data.length"
                    :option="speedOption"
                    :style="{ height: '170px' }"
                    autoresize
                  />
                  <div v-else class="flex items-center justify-center text-muted text-sm" style="height: 170px">
                    Sin datos para el periodo seleccionado
                  </div>
                </ClientOnly>
              </UCard>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Velocidad maxima</p>
                  <p class="text-xl font-black text-slate-900 mt-2">
                    {{ speedMetrics?.max ?? '-' }}
                    <span class="text-[10px] text-slate-400">km/h</span>
                  </p>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Velocidad minima</p>
                  <p class="text-xl font-black text-slate-900 mt-2">
                    {{ speedMetrics?.min ?? '-' }}
                    <span class="text-[10px] text-slate-400">km/h</span>
                  </p>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Kilometraje</p>
                  <p class="text-xl font-black text-slate-900 mt-2">
                    {{ activeDistance ?? '-' }}
                    <span class="text-[10px] text-slate-400">km</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'fuel'" class="space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 class="font-serif text-2xl font-bold text-slate-900">Consumo de combustible</h3>
                <p class="text-xs text-slate-500 mt-1">
                  Resumen diario de gastos de combustible.
                </p>
              </div>
            </div>

            <div v-if="isExpensesLoading || isCategoriesLoading" class="text-sm text-slate-500">
              Cargando consumos...
            </div>
            <div v-else-if="!fuelDailyTotals.length" class="text-sm text-slate-500">
              Sin registros de combustible para esta unidad.
            </div>
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Total periodo</p>
                  <p class="text-xl font-black text-slate-900 mt-2">S/ {{ fuelSummary?.total.toFixed(2) }}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Promedio diario</p>
                  <p class="text-xl font-black text-slate-900 mt-2">S/ {{ fuelSummary?.avg.toFixed(2) }}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-2xl p-4">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Dias con consumo</p>
                  <p class="text-xl font-black text-slate-900 mt-2">{{ fuelSummary?.days }}</p>
                </div>
              </div>

              <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div class="px-5 py-3 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Ultimos 10 dias
                </div>
                <ClientOnly>
                  <VChart
                    v-if="fuelDailyTotals.length"
                    :option="fuelChartOption"
                    :style="{ height: '160px' }"
                    autoresize
                  />
                  <div v-else class="flex items-center justify-center text-muted text-sm" style="height: 160px">
                    Sin datos
                  </div>
                </ClientOnly>
              </div>

              <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div class="grid grid-cols-2 px-5 py-3 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span>Fecha</span>
                  <span class="text-right">Monto</span>
                </div>
                <div v-for="row in fuelDailyTotals.slice(0, 10)" :key="row.label" class="grid grid-cols-2 px-5 py-3 border-b border-slate-50 text-sm">
                  <span class="text-slate-700">{{ row.label }}</span>
                  <span class="text-right font-semibold">S/ {{ row.total.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>
