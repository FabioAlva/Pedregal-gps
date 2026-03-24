<script setup lang="ts">
import { onMounted } from 'vue'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useAreaStays } from '#layers/gps/app/composables/useAreaStays'
import { formatLocalDate } from '#layers/gps/app/utils/FormatTime'

const { fetchDevices } = useFilter()
const { isLoading, report, errorMessage, selectedZone, zoneOptions, rows, fetchAreaStays } = useAreaStays()

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

onMounted(async () => {
  await fetchDevices()
  await fetchAreaStays({ showValidationMessage: false })
})
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <div class="shrink-0 border-b border-default">
      <FilterComponent :on-search="fetchAreaStays" />
    </div>

    <div class="flex-1 overflow-auto p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-primary">Geolocalizacion</p>
          <h1 class="text-xl font-bold text-highlighted">Ingresos y salidas por area</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">Eventos</p>
          <p class="text-2xl font-black text-highlighted">{{ report?.count ?? 0 }}</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">Tiempo total</p>
          <p class="text-2xl font-black text-primary">{{ report?.totalHours ?? 0 }} h</p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">Minutos totales</p>
          <p class="text-2xl font-black text-success">{{ report?.totalMinutes ?? 0 }}</p>
        </UCard>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="errorMessage"
        class="mb-4"
      />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-highlighted">Detalle de estadias</span>
            <div class="flex items-center gap-3">
              <USelectMenu
                v-model="selectedZone"
                :items="zoneOptions"
                value-key="value"
                label-key="label"
                size="xs"
                class="w-56"
                placeholder="Filtrar por zona"
              />
              <span class="text-xs text-muted">{{ rows.length }} registros</span>
            </div>
          </div>
        </template>

        <div v-if="isLoading" class="py-12 flex justify-center">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
        </div>

        <div v-else-if="!rows.length" class="py-12 text-center text-sm text-muted">
          No hay ingresos/salidas para el rango seleccionado.
        </div>

        <div v-else class="overflow-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left text-xs uppercase text-muted">
                <th class="py-2 pr-4">Area</th>
                <th class="py-2 pr-4">GPS</th>
                <th class="py-2 pr-4">Ingreso</th>
                <th class="py-2 pr-4">Salida</th>
                <th class="py-2 pr-4">Duracion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stay in rows" :key="stay.id" class="border-b border-default/60">
                <td class="py-3 pr-4 font-semibold text-highlighted">{{ stay.geofenceName }}</td>
                <td class="py-3 pr-4 font-mono text-xs">{{ stay.deviceId }}</td>
                <td class="py-3 pr-4">{{ formatDateValue(stay.enteredAt) }}</td>
                <td class="py-3 pr-4">{{ formatDateValue(stay.exitedAt) }}</td>
                <td class="py-3 pr-4 font-mono">{{ formatDuration(stay.durationSeconds) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>
