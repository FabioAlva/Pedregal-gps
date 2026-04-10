<script setup lang="ts">
import LocationsMap from '#layers/gps/app/components/LocationsMap.client.vue'
import { useGeoConfig } from '#layers/gps/app/composables/useGeoConfig'
import { useFields } from '#layers/gps/app/composables/useFields'
import { circleToPolygon } from '#layers/gps/app/utils/field-geometry'

type DrawMode = 'field' | 'center' | 'boundary'
type FieldShape = 'circle' | 'polygon'
type SettingsPanel = 'map' | 'field'

type LatLng = [number, number]

const { center: configCenter, boundary, fetchConfig, saveConfig, isSaving } = useGeoConfig()
const { saveField, importGeojson } = useFields()

const activeMode = ref<DrawMode | null>(null)
const tempCoords = ref<LatLng | null>(null)
const boundaryDraft = ref<LatLng[]>([])
const viewCenter = ref<LatLng | null>(null)
const fieldShape = ref<FieldShape>('circle')
const fieldDraft = ref<LatLng[]>([])
const fieldName = ref('')
const fieldRadius = ref(300)
const fieldColor = ref('#3b82f6')
const fieldTipo = ref<'DELIMITADOR' | 'GUIA' | 'INTERES'>('GUIA')
const isSavingField = ref(false)
const isImportingGeojson = ref(false)
const showSettings = ref(false)
const activePanel = ref<SettingsPanel>('map')

const settingsItems = [
  [
    {
      label: 'Configurar mapa',
      icon: 'i-lucide-map',
      onSelect: () => {
        activePanel.value = 'map'
        showSettings.value = true
      }
    },
    {
      label: 'Configurar campos',
      icon: 'i-lucide-shapes',
      onSelect: () => {
        activePanel.value = 'field'
        showSettings.value = true
      }
    }
  ]
]

const isDrawing = computed(() => activeMode.value !== null)
const drawMode = computed<DrawMode>(() => activeMode.value ?? 'field')

const mapCenter = computed<LatLng>(() => {
  return viewCenter.value
    ?? configCenter.value
    ?? [-5.1961, -80.6266]
})

const boundaryPreview = computed(() => {
  return activeMode.value === 'boundary' ? boundaryDraft.value : boundary.value
})

const fieldPointsPreview = computed(() => {
  return fieldShape.value === 'polygon' ? fieldDraft.value : []
})

const startCenterSelection = () => {
  activeMode.value = 'center'
  showSettings.value = true
  activePanel.value = 'map'
}

const startBoundarySelection = () => {
  activeMode.value = 'boundary'
  boundaryDraft.value = boundary.value?.length ? [...boundary.value] : []
  showSettings.value = true
  activePanel.value = 'map'
}

const startFieldSelection = () => {
  activeMode.value = 'field'
  fieldName.value = ''
  fieldColor.value = '#3b82f6'
  fieldTipo.value = 'GUIA'
  fieldDraft.value = []
  showSettings.value = true
  activePanel.value = 'field'
  if (fieldShape.value === 'circle') {
    tempCoords.value = mapCenter.value
  } else {
    tempCoords.value = null
  }
}

const cancelDrawing = () => {
  if (activeMode.value === 'field') tempCoords.value = null
  activeMode.value = null
}

const onCenterSelected = (coords: LatLng) => {
  configCenter.value = coords
  viewCenter.value = coords
  activeMode.value = null
}

const onBoundaryPointAdded = (coords: LatLng) => {
  if (activeMode.value !== 'boundary') return
  if (boundaryDraft.value.length === 0) {
    boundaryDraft.value = [coords]
    return
  }
  if (boundaryDraft.value.length === 1) {
    boundaryDraft.value = [boundaryDraft.value[0]!, coords]
    return
  }
  boundaryDraft.value = [boundaryDraft.value[0]!, coords]
}

const onFieldPointAdded = (coords: LatLng) => {
  if (activeMode.value !== 'field') return
  if (fieldShape.value !== 'polygon') return
  fieldDraft.value = [...fieldDraft.value, coords]
}

const finalizeBoundary = () => {
  if (boundaryDraft.value.length < 2) return
  boundary.value = [...boundaryDraft.value]
  activeMode.value = null
}

const clearBoundary = () => {
  boundaryDraft.value = []
  boundary.value = []
}

const clearFieldDraft = () => {
  fieldDraft.value = []
}

const saveFieldDraft = async () => {
  if (!fieldName.value.trim()) return

  if (fieldShape.value === 'circle' && !tempCoords.value) return
  if (fieldShape.value === 'polygon' && fieldDraft.value.length < 3) return

  isSavingField.value = true
  try {
    if (fieldShape.value === 'circle' && tempCoords.value) {
      const polygon = circleToPolygon(tempCoords.value, Number(fieldRadius.value || 300))
      await saveField({
        nombre: fieldName.value.trim(),
        categoria: 'CAMPO',
        tipo: fieldTipo.value,
        coords: polygon,
        color: fieldColor.value
      })
    } else {
      await saveField({
        nombre: fieldName.value.trim(),
        categoria: 'CAMPO',
        tipo: fieldTipo.value,
        coords: fieldDraft.value,
        color: fieldColor.value
      })
    }
    fieldName.value = ''
    fieldDraft.value = []
    tempCoords.value = null
    activeMode.value = null
  } finally {
    isSavingField.value = false
  }
}

const onSaveConfig = async () => {
  await saveConfig({
    center: configCenter.value,
    boundary: boundary.value
  })
}

const onImportGeojson = async () => {
  if (isImportingGeojson.value) return
  if (import.meta.client && !window.confirm('Importar GeoJSON desde public/maps/map.geojson?')) return
  isImportingGeojson.value = true
  try {
    await importGeojson()
  } finally {
    isImportingGeojson.value = false
  }
}

onMounted(async () => {
  await fetchConfig()
  viewCenter.value = configCenter.value
})
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-serif text-4xl font-bold tracking-tighter text-slate-950 leading-none">Zonas y Campos</h1>
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
          <span>Flota Agricola</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
          <span class="text-slate-600">Configuracion de Mapa</span>
        </nav>
      </div>
      <UDropdownMenu
        :items="settingsItems"
        :content="{ align: 'end', sideOffset: 8 }"
        :ui="{ content: 'w-56' }"
      >
        <UButton
          icon="i-lucide-settings"
          label="Configurar"
          color="neutral"
          variant="ghost"
          class="font-bold"
          @click="showSettings = true"
        />
      </UDropdownMenu>
    </header>

    <div class="bg-white border border-slate-200 shadow-sm flex-1 overflow-hidden relative">
      <ClientOnly>
        <LocationsMap
          :is-drawing="isDrawing"
          :temp-coords="tempCoords"
          :draw-mode="drawMode"
          :show-routes="false"
          :enable-realtime="false"
          :center-override="mapCenter"
          :center-marker="configCenter"
          :boundary-coords="boundaryPreview"
          :show-boundary-markers="activeMode === 'boundary'"
          :use-boundary-bounds="false"
          :show-boundary-mask="false"
          :use-zone-marker="false"
          :field-shape="fieldShape"
          :field-draft-coords="fieldPointsPreview"
          :show-field-draft-markers="activeMode === 'field' && fieldShape === 'polygon'"
          :field-radius="fieldRadius"
          @cancel-drawing="cancelDrawing"
          @update-coords="(coords) => (tempCoords = coords)"
          @update-center="onCenterSelected"
          @add-boundary-point="onBoundaryPointAdded"
          @add-field-point="onFieldPointAdded"
        />
      </ClientOnly>
      <div
        v-if="showSettings"
        class="absolute top-4 right-4 z-[1000] w-[380px] max-w-[92vw]"
      >
        <UCard class="border border-slate-200 shadow-xl">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="text-slate-600 w-4 h-4" />
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {{ activePanel === 'map' ? 'Configurar mapa' : 'Configurar campos' }}
                </span>
              </div>
              <UButton
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="showSettings = false"
              />
            </div>
          </template>

          <div v-if="activePanel === 'map'" class="space-y-4">
            <div class="rounded-xl border border-slate-200/70 bg-white/80 p-3">
              <p class="text-[10px] font-bold uppercase text-slate-500">Centro de la empresa</p>
              <p class="text-[11px] text-slate-600 mt-1">
                <span v-if="configCenter">{{ configCenter[0].toFixed(5) }}, {{ configCenter[1].toFixed(5) }}</span>
                <span v-else class="italic text-slate-400">Sin definir</span>
              </p>
              <div class="flex items-center justify-between mt-3">
                <p class="text-[10px] text-slate-600">Define donde aparece el mapa por defecto.</p>
                <UButton
                  label="Ubicar"
                  size="xs"
                  icon="i-lucide-crosshair"
                  variant="soft"
                  color="neutral"
                  @click="startCenterSelection"
                />
              </div>
              <div v-if="activeMode === 'center'" class="mt-2 text-[10px] text-slate-600 font-semibold">
                Haz clic en el mapa para definir el centro.
              </div>
            </div>

            <div class="rounded-xl border border-slate-200/70 bg-white/80 p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[10px] font-bold uppercase text-slate-500">Limite del mapa</p>
                  <p class="text-[11px] text-slate-600">{{ boundaryPreview.length === 2 ? 'Rectangulo definido' : 'Sin definir' }}</p>
                </div>
                <div class="flex gap-2">
                  <UButton
                    label="Editar"
                    size="xs"
                    icon="i-lucide-pencil"
                    variant="soft"
                    color="neutral"
                    @click="startBoundarySelection"
                  />
                  <UButton
                    label="Reiniciar"
                    size="xs"
                    icon="i-lucide-rotate-ccw"
                    variant="ghost"
                    color="neutral"
                    @click="clearBoundary"
                  />
                </div>
              </div>
              <div v-if="activeMode === 'boundary'" class="text-[10px] text-slate-600 font-semibold">
                Marca dos esquinas opuestas para definir el rectangulo.
              </div>
              <UButton
                label="Confirmar limite"
                size="xs"
                icon="i-lucide-check"
                block
                :disabled="boundaryDraft.length < 2"
                color="neutral"
                @click="finalizeBoundary"
              />
            </div>

            <div class="border-t pt-3">
              <UButton
                label="Guardar configuracion"
                icon="i-lucide-save"
                block
                color="neutral"
                :loading="isSaving"
                @click="onSaveConfig"
              />
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="rounded-xl border border-slate-200/70 bg-white/80 p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[10px] font-bold uppercase text-slate-500">Importar GeoJSON</p>
                  <p class="text-[11px] text-slate-600">Fuente: public/maps/map.geojson</p>
                </div>
                <UButton
                  label="Importar"
                  size="xs"
                  icon="i-lucide-upload"
                  variant="soft"
                  color="neutral"
                  :loading="isImportingGeojson"
                  @click="onImportGeojson"
                />
              </div>
              <p class="text-[10px] text-slate-500">
                Se importan solo poligonos y se calcula la jerarquia por contencion.
              </p>
            </div>

            <div class="rounded-xl border border-slate-200/70 bg-white/80 p-3 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-bold uppercase text-slate-500">Crear campo</p>
                <UButton
                  label="Iniciar"
                  size="xs"
                  icon="i-lucide-plus"
                  variant="soft"
                  color="neutral"
                  @click="startFieldSelection"
                />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <UButton
                  :label="'Circular'"
                  size="xs"
                  icon="i-lucide-circle"
                  :variant="fieldShape === 'circle' ? 'solid' : 'ghost'"
                  color="neutral"
                  @click="fieldShape = 'circle'"
                />
                <UButton
                  :label="'Poligonal'"
                  size="xs"
                  icon="i-lucide-triangle"
                  :variant="fieldShape === 'polygon' ? 'solid' : 'ghost'"
                  color="neutral"
                  @click="fieldShape = 'polygon'"
                />
              </div>

              <div class="grid grid-cols-1 gap-2">
                <UInput v-model="fieldName" placeholder="Nombre de campo" size="xs" />
              </div>

              <USelectMenu
                v-model="fieldTipo"
                :items="[
                  { label: 'Delimitador', value: 'DELIMITADOR' },
                  { label: 'Guia', value: 'GUIA' },
                  { label: 'Interes', value: 'INTERES' }
                ]"
                value-key="value"
                label-key="label"
                size="xs"
                placeholder="Tipo de campo"
              />

              <div class="flex items-center gap-2">
                <UInput
                  v-model="fieldColor"
                  type="color"
                  class="w-10 h-8 p-0 overflow-hidden"
                />
                <span class="text-[10px] font-bold uppercase text-slate-500">Color del campo</span>
              </div>

              <UInput
                v-if="fieldShape === 'circle'"
                v-model="fieldRadius"
                type="number"
                size="xs"
                trailing-icon="i-lucide-ruler"
                placeholder="Radio (m)"
              />

              <div v-if="activeMode === 'field'" class="text-[10px] text-slate-600 font-semibold">
                <span v-if="fieldShape === 'circle'">Haz clic en el mapa para definir el centro.</span>
                <span v-else>Haz clic para agregar puntos del poligono (minimo 3).</span>
              </div>

              <div class="flex gap-2">
                <UButton
                  label="Limpiar puntos"
                  size="xs"
                  icon="i-lucide-eraser"
                  variant="ghost"
                  color="neutral"
                  @click="clearFieldDraft"
                />
                <UButton
                  label="Guardar campo"
                  size="xs"
                  icon="i-lucide-save"
                  class="flex-1"
                  color="neutral"
                  :loading="isSavingField"
                  :disabled="!fieldName.trim() || (fieldShape === 'circle' ? !tempCoords : fieldDraft.length < 3)"
                  @click="saveFieldDraft"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
