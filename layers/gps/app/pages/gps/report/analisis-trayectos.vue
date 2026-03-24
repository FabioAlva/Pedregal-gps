<script setup lang="ts">
import { onMounted } from 'vue'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import { useRouteAnalysisView } from '#layers/gps/app/composables/useRouteAnalysisView'
import { formatLocalDate } from '#layers/gps/app/utils/FormatTime'

const {
  rows,
  rowsPreview,
  deviceSummaries,
  isLoading,
  errorMessage,
  fetchRouteAnalysis,
  exportRouteAnalysisCsv,
  formatDuration,
  formatCoords,
  globalStats,
  hasRows,
  showDetailTable,
  gapDistributionOption,
  gapHistogramOption,
  gapTimelineOption,
  trendBucketLabel,
  initialize
} = useRouteAnalysisView()

onMounted(async () => {
  await initialize()
})
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <div class="shrink-0 border-b border-default">
      <FilterComponent :on-search="fetchRouteAnalysis" />
    </div>

    <div class="flex-1 overflow-auto p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-primary">Geolocalizacion</p>
          <h1 class="text-xl font-bold text-highlighted">Analisis de trayectos</h1>
        </div>
        <UButton
          icon="i-lucide-download"
          color="primary"
          variant="soft"
          :disabled="!rows.length"
          @click="exportRouteAnalysisCsv"
        >
          Exportar CSV
        </UButton>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="errorMessage"
        class="mb-4"
      />

      <UCard class="mb-4">
        <template #header>
          <span class="text-sm font-semibold text-highlighted">Autos incluidos en el analisis</span>
        </template>

        <div v-if="deviceSummaries.length" class="flex flex-wrap gap-2">
          <div
            v-for="item in deviceSummaries"
            :key="item.deviceId"
            class="inline-flex items-center gap-2 rounded-lg border border-default bg-elevated px-3 py-1.5"
          >
            <span class="w-2 h-2 rounded-full" :style="{ background: item.deviceColor }" />
            <span class="text-xs font-bold text-highlighted">{{ item.deviceName }}</span>
            <span class="text-[11px] text-muted font-mono">{{ item.deviceId }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-muted">Sin autos para el rango seleccionado.</p>
      </UCard>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <UCard>
          <p class="text-xs uppercase tracking-wide text-muted">Brechas de tiempo &gt; 1h</p>
          <p class="text-2xl font-black text-error">{{ globalStats.overOneHour }}</p>
          <p class="text-xs text-muted">Entre reportes GPS consecutivos</p>
        </UCard>

        <UCard>
          <p class="text-xs uppercase tracking-wide text-muted">Brechas de tiempo &lt;= 1h</p>
          <p class="text-2xl font-black text-success">{{ globalStats.upToOneHour }}</p>
          <p class="text-xs text-muted">Entre reportes GPS consecutivos</p>
        </UCard>

        <UCard>
          <p class="text-xs uppercase tracking-wide text-muted">Tiempo promedio entre reportes</p>
          <p class="text-2xl font-black text-primary">{{ formatDuration(globalStats.avgGapSeconds) }}</p>
          <p class="text-xs text-muted">Diferencia entre reportes GPS consecutivos</p>
        </UCard>

        <UCard>
          <p class="text-xs uppercase tracking-wide text-muted">Mayor brecha de tiempo</p>
          <p class="text-2xl font-black text-highlighted">{{ formatDuration(globalStats.maxGapSeconds) }}</p>
          <p class="text-xs text-muted">Mayor diferencia entre reportes GPS</p>
        </UCard>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <UCard>
          <template #header>
            <span class="text-sm font-semibold text-highlighted">Porcentaje de brechas de tiempo entre reportes GPS (&lt; 1h / &gt; 1h)</span>
          </template>
          <ClientOnly>
            <VChart :option="gapDistributionOption" :style="{ height: '300px' }" autoresize />
            <template #fallback>
              <USkeleton class="w-full h-70" />
            </template>
          </ClientOnly>
        </UCard>

        <UCard>
          <template #header>
            <span class="text-sm font-semibold text-highlighted">Distribucion de tiempo entre reportes GPS consecutivos</span>
          </template>
          <ClientOnly v-if="hasRows">
            <VChart :option="gapHistogramOption" :style="{ height: '300px' }" autoresize />
            <template #fallback>
              <USkeleton class="w-full h-70" />
            </template>
          </ClientOnly>
          <div v-else class="h-70 flex items-center justify-center text-sm text-muted">Sin datos para histograma.</div>
        </UCard>

        <UCard class="xl:col-span-2">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-semibold text-highlighted">Tendencia del tiempo entre reportes GPS por auto (min)</span>
              <UBadge color="neutral" variant="soft">Intervalo: {{ trendBucketLabel }}</UBadge>
            </div>
          </template>
          <p class="px-4 pt-1 text-xs text-muted text-center">
            Cada punto representa la brecha de tiempo promedio entre reportes GPS consecutivos, agrupada en bloques de {{ trendBucketLabel }}.
          </p>
          <ClientOnly v-if="hasRows">
            <VChart :option="gapTimelineOption" :style="{ height: '280px' }" autoresize />
            <template #fallback>
              <USkeleton class="w-full h-70" />
            </template>
          </ClientOnly>
          <div v-else class="h-70 flex items-center justify-center text-sm text-muted">Sin datos para tendencia.</div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-highlighted">Detalle de trayectos entre puntos GPS</span>
            <div class="flex items-center gap-3">
              <span class="text-xs text-muted">Mostrando {{ rowsPreview.length }} de {{ rows.length }} segmentos</span>
              <UButton
                size="xs"
                variant="soft"
                color="neutral"
                :icon="showDetailTable ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="showDetailTable = !showDetailTable"
              >
                {{ showDetailTable ? 'Ocultar detalle' : 'Mostrar detalle' }}
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="isLoading" class="py-12 flex justify-center">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
        </div>

        <div v-else-if="!rows.length" class="py-12 text-center text-sm text-muted">
          No hay trayectos para el rango seleccionado.
        </div>

        <div v-else-if="!showDetailTable" class="py-10 text-center text-sm text-muted">
          El detalle esta oculto. Puedes exportar el CSV completo sin mostrar la tabla.
        </div>

        <div v-else class="overflow-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left text-xs uppercase text-muted">
                <th class="py-2 pr-4">Punto inicial</th>
                <th class="py-2 pr-4">Tiempo inicial</th>
                <th class="py-2 pr-4">Velocidad i</th>
                <th class="py-2 pr-4">Punto final</th>
                <th class="py-2 pr-4">Tiempo (i-f)</th>
                <th class="py-2 pr-4">Velocidad f</th>
                <th class="py-2 pr-4">Distancia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rowsPreview" :key="row.id" class="border-b border-default/60">
                <td class="py-3 pr-4 font-mono text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full" :style="{ background: row.deviceColor }" />
                    <p class="text-highlighted font-semibold">{{ row.deviceName }}</p>
                  </div>
                  <p>{{ formatCoords(row.startLat, row.startLng) }}</p>
                  <p class="text-muted">GPS: {{ row.deviceId }}</p>
                </td>
                <td class="py-3 pr-4">{{ formatLocalDate(row.startTs) }}</td>
                <td class="py-3 pr-4 font-mono">{{ row.startSpeedKmh.toFixed(2) }} km/h</td>
                <td class="py-3 pr-4 font-mono text-xs">{{ formatCoords(row.endLat, row.endLng) }}</td>
                <td class="py-3 pr-4 font-mono">{{ formatDuration(row.durationSeconds) }}</td>
                <td class="py-3 pr-4 font-mono">{{ row.endSpeedKmh.toFixed(2) }} km/h</td>
                <td class="py-3 pr-4 font-mono">{{ row.distanceKm.toFixed(3) }} km</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>
