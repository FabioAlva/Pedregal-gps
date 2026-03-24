<script setup lang="ts">
import { useMap } from '#layers/gps/app/composables/useMap'
import FilterComponent from '#layers/gps/app/components/FilterComponent.vue'
import GeofencePanel from '#layers/gps/app/components/GeofencePanel.vue'
import LocationsMap from '#layers/gps/app/components/LocationsMap.client.vue'

const { fetchDeviceData, center } = useMap()

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
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <FilterComponent :on-search="fetchDeviceData" />
    <div class="w-full h-full relative">
     <ClientOnly>

      <LocationsMap
        :is-drawing="isDrawing"
        :temp-coords="tempCoords"
        @cancel-drawing="resetDrawing"
        @update-coords="(c) => (tempCoords = c)"
      />
     </ClientOnly>

      <GeofencePanel
        :is-drawing="isDrawing"
        @place-selected="(c) => (center = [c.lat, c.lng])"
        @open-create-modal="handleOpenCreate"
        @cancel-drawing="resetDrawing"
      />
    </div>
  </div>
</template>
