<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useAreaStays } from '#layers/gps/app/composables/useAreaStays'
import { formatLocalDate } from '#layers/gps/app/utils/FormatTime'

const { fetchDevices } = useFilter()
const { isLoading, report, errorMessage, selectedField, fieldOptions, rows, fetchAreaStays } = useAreaStays()

const formatDateValue = (value?: string | null) => {
  if (!value) return 'Vigente'
  return formatLocalDate(new Date(value).getTime())
}

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60

  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

const page = ref(1)
const itemsPerPage = 25

const pagedRows = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return rows.value.slice(start, start + itemsPerPage)
})

const totalRows = computed(() => rows.value.length)

watch([selectedField, totalRows], () => {
  page.value = 1
})

onMounted(async () => {
  await fetchDevices()
  await fetchAreaStays({ showValidationMessage: false })
})
</script>

<template>
<div class="w-full flex flex-col font-sans text-slate-900 overflow-hidden h-full">
  <header class="flex flex-col w-full mb-6 shrink-0">
      <div class="pb-3 pl-1">
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <span>Flota Agrícola</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-40" />
          <span class="text-slate-900">Estadías por Campo</span>
        </nav>
      </div>
    </header>
    <div class="bg-white border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <FilterComponent :on-search="fetchAreaStays" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Eventos</p>
        <p class="text-3xl font-black text-slate-950 mt-2">{{ report?.count ?? 0 }}</p>
      </div>
      <div class="border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tiempo total</p>
        <p class="text-3xl font-black text-primary mt-2">{{ report?.totalHours ?? 0 }} h</p>
      </div>
      <div class="border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Minutos totales</p>
        <p class="text-3xl font-black text-success mt-2">{{ report?.totalMinutes ?? 0 }}</p>
      </div>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :description="errorMessage"
      class="mb-6"
    />

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalle</p>
          <h2 class="text-lg font-bold text-slate-950">Estadias por Campo</h2>
        </div>
        <div class="flex items-center gap-3">
          <USelectMenu
            v-model="selectedField"
            :items="fieldOptions"
            value-key="value"
            label-key="label"
            size="xs"
            class="w-56"
            placeholder="Filtrar por campo"
          />
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ rows.length }} registros</span>
        </div>
      </div>

      <div v-if="isLoading" class="py-16 flex justify-center">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
      </div>

      <div v-else-if="!rows.length" class="py-16 text-center text-sm text-slate-400">
        No hay ingresos/salidas para el rango seleccionado.
      </div>

      <div v-else class="overflow-auto flex-1">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/50">
            <tr class="text-left">
              <th class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5">Campo</th>
              <th class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5">GPS</th>
              <th class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5">Ingreso</th>
              <th class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5">Salida</th>
              <th class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5">Duracion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stay in pagedRows" :key="stay.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td class="px-10 py-6 font-semibold text-slate-950">{{ stay.fieldName }}</td>
              <td class="px-10 py-6 font-mono text-xs text-slate-600">{{ stay.deviceId }}</td>
              <td class="px-10 py-6">{{ formatDateValue(stay.enteredAt) }}</td>
              <td class="px-10 py-6">{{ formatDateValue(stay.exitedAt) }}</td>
              <td class="px-10 py-6 font-mono">{{ formatDuration(stay.durationSeconds) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ totalRows }} registros
        </p>
        <UPagination
          v-if="totalRows > itemsPerPage"
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total="totalRows"
          size="xs"
        />
      </div>
    </div>
  </div>
</template>

