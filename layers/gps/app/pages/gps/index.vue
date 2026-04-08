<script setup lang="ts">
import { useMap } from '#layers/gps/app/composables/useMap'
import { useGeoConfig } from '#layers/gps/app/composables/useGeoConfig'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import GeofencePanel from '#layers/gps/app/components/GeofencePanel.vue'
import LocationsMap from '#layers/gps/app/components/LocationsMap.client.vue'

const { fetchDeviceData, center } = useMap()
const { center: configCenter, boundary, fetchConfig } = useGeoConfig()

const isDrawing = ref(false)
const tempCoords = ref<[number, number] | null>(null)

const handleOpenCreate = () => {
  isDrawing.value = true
  if (center.value[0] == null || center.value[1] == null) {
    return
  }
  tempCoords.value = [center.value[0], center.value[1]]
}

const resetDrawing = () => {
  isDrawing.value = false
  tempCoords.value = null
}

onMounted(async () => {
  await fetchConfig()
})
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Mapa en Tiempo Real</span>
          </nav>
        </div>
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <FilterComponent :on-search="fetchDeviceData" />
    </div>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 relative">
      <ClientOnly>
        <LocationsMap
          class="absolute inset-0"
          :is-drawing="isDrawing"
          :temp-coords="tempCoords"
          :boundary-coords="boundary"
          :center-marker="configCenter"
          :use-boundary-bounds="true"
          :show-boundary-mask="true"
          @cancel-drawing="resetDrawing"
          @update-coords="(c) => (tempCoords = c)"
        />
      </ClientOnly>
    </div>
  </div>
</template>
