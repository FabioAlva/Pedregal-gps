<script setup lang="ts">
import { useMap } from '#layers/gps/app/composables/useMap'
import { useGeoConfig } from '#layers/gps/app/composables/useGeoConfig'
import FilterComponentGPS from '#layers/gps/app/components/FilterComponentGPS.vue'
import GeofencePanel from '#layers/gps/app/components/GeofencePanel.vue'
import LocationsMap from '#layers/gps/app/components/LocationsMap.client.vue'

const { fetchDeviceData, center } = useMap()
const { center: configCenter, boundary, fetchConfig } = useGeoConfig()

const isDrawing = ref(false)
const tempCoords = ref<[number, number] | null>(null)
const showFilters = ref(false)
const mapResizeKey = ref(0)

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

const limitCoords = computed(() => boundary.value ?? [])

onMounted(async () => {
  await fetchConfig()
})

watch(showFilters, () => {
  mapResizeKey.value += 1
})
</script>

<template>
  <div class="absolute inset-0 font-sans text-slate-900 overflow-hidden">
    <div class="absolute left-4 top-24 z-[1000]">
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        :icon="showFilters ? 'i-lucide-eye-off' : 'i-lucide-filter'"
        class="shadow-lg bg-white text-black border-slate-300"
        @click="showFilters = !showFilters"
      />
    </div>

    <div
      class="absolute left-0 top-0 h-full z-[1100] transition-transform duration-300"
      :class="showFilters ? 'translate-x-0' : '-translate-x-full'"
    >
      <FilterComponentGPS :on-search="fetchDeviceData" :on-close="() => (showFilters = false)" />
    </div>

    <div class="absolute inset-0 z-0">
      <ClientOnly>
        <LocationsMap
          class="absolute inset-0"
          :is-drawing="isDrawing"
          :temp-coords="tempCoords"
          :show-routes="true"
          :enable-realtime="true"
          :boundary-coords="limitCoords"
          :center-marker="null"
          :use-boundary-bounds="true"
          :show-boundary-mask="false"
          :show-boundary-overlay="false"
          :show-field-mask="true"
          :enforce-max-bounds="true"
          :invalidate-size-key="mapResizeKey"
          @cancel-drawing="resetDrawing"
          @update-coords="(c) => (tempCoords = c)"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style>
:global(#main-content),
:global(#main-content .udashboard-panel-body),
:global(.udashboard-panel-body) {
  padding: 0 !important;
  margin: 0 !important;
}

html, body, #__nuxt {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
