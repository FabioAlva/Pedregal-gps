<template>
  <div class="absolute top-4 right-4 z-1000 flex flex-col gap-3 w-80">
    <UCard
      v-if="!isDrawing"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-search"
            class="text-primary  w-4 h-4"
          />
          <span class="text-[11px] font-bold text-primary uppercase tracking-wider">Buscar Ubicación</span>
        </div>
      </template>

      <div class="flex flex-col gap-2">
        <UInput
          v-model="searchQuery"
          placeholder="Ej: Plaza de Armas..."
          icon="i-lucide-map-pin"
          size="sm"
          @keyup.enter="onSearch"
        />

        <div
          v-if="searchResults.length"
          class="mt-2 max-h-48 overflow-y-auto rounded-md bg-white divide-y divide-gray-100 shadow-inner"
        >
          <div
            v-for="place in searchResults"
            :key="place.place_id"
            class="p-3 text-[11px] hover:bg-blue-50 cursor-pointer transition-colors flex items-start gap-2 text-slate-700"
            @click="selectPlace(place)"
          >
            <UIcon
              name="i-lucide-map"
              class="text-slate-400 mt-0.5 w-3 h-3"
            />
            <span class="leading-tight">{{ place.display_name }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <UCard
      v-else
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <UIcon
          name="i-lucide-map-pin"
          class="text-primary w-8 h-8"
        />
        <div class="text-primary ">
          <p class="font-bold text-sm  uppercase">
            Modo de Selección
          </p>
          <p class="text-[11px] opacity-90">
            Haga clic en el mapa para ubicar el centro.
          </p>
        </div>
        <UButton
          label="Cancelar Selección"
          icon="i-lucide-x"
          color="primary"
          variant="solid"
          size="xs"
          class="text-white font-bold"
          @click="$emit('cancel-drawing')"
        />
      </div>
    </UCard>

    <UButton
      v-if="!isDrawing"
      label="Nueva Zona"
      icon="i-lucide-plus"
      block
      size="xl"
      class="bg-primary hover:bg-primary-700 text-white font-bold h-12 shadow-xl"
      @click="$emit('open-create-modal')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const searchResults = ref<any[]>([])
defineProps<{ isDrawing: boolean }>()

const emit = defineEmits(['place-selected', 'open-create-modal', 'cancel-drawing'])
const onSearch = async () => {
  const normalizedQuery = searchQuery.value.trim()
  if (normalizedQuery.length < 3) return

  const queryWithCountry = /(?:^|,\s*)per[uú]\b/i.test(normalizedQuery)
    ? normalizedQuery
    : `${normalizedQuery}, Perú`

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCountry)}&countrycodes=pe&addressdetails=1&limit=5`, {
      headers: { 'User-Agent': 'MiAppGeocercas/1.0' }
    })
    searchResults.value = await res.json()
  } catch (error) {
    console.error('Error en búsqueda:', error)
    searchResults.value = []
  }
}

const selectPlace = (place: any) => {
  emit('place-selected', { lat: parseFloat(place.lat), lng: parseFloat(place.lon) })
  searchResults.value = []
  searchQuery.value = ''
}
</script>
