<script lang="ts" setup>

import { useMap } from '#layers/gps/app/composables/useMap'
import { useGpsRealtime } from '#layers/gps/app/composables/useGpsRealtime'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useGeofences } from '#layers/gps/app/composables/useGeofences'
import CarIcon from '#layers/gps/app/components/CarIcon.vue'
import ZoneMarker from '#layers/gps/app/components/ZoneMarker.vue'
import type { Geofence } from '#shared/types/db'
import { asLatLng, asPolygon, isInsideGeofence } from '#layers/gps/app/utils/geofence-geometry'
import type { ProcessedRoute } from '../types/IMap'

type SaveGeofencePayload = Parameters<typeof saveGeofence>[0]
type ZoneSavePayload = Omit<SaveGeofencePayload, 'coords'>

const { fetchDevices } = useFilter()
const { fetchDeviceData, center, processedRoutes } = useMap()
const { stopRealtime, startRealtime, isStreaming } = useGpsRealtime()
const {
  geofences,
  isSaving,
  saveGeofence,
  fetchGeofences,
  updateGeofence,
  deleteGeofence
} = useGeofences()

/*Para saber si esta pintando en el mapa o no y donde*/
const {
  isDrawing,
  tempCoords,
  drawMode = 'geofence',
  showRoutes = true,
  enableRealtime = true,
  centerOverride = null,
  centerMarker = null,
  boundaryCoords = null,
  showBoundaryMarkers = false,
  useBoundaryBounds = false,
  showBoundaryMask = false,
  useZoneMarker = true,
  geofenceShape = 'circle',
  geofenceDraftCoords = null,
  showGeofenceDraftMarkers = false,
  geofenceRadius = 300
} = defineProps<{
  isDrawing: boolean
  tempCoords: [number, number] | null
  drawMode?: 'geofence' | 'center' | 'boundary'
  showRoutes?: boolean
  enableRealtime?: boolean
  centerOverride?: [number, number] | null
  centerMarker?: [number, number] | null
  boundaryCoords?: [number, number][] | null
  showBoundaryMarkers?: boolean
  useBoundaryBounds?: boolean
  showBoundaryMask?: boolean
  useZoneMarker?: boolean
  geofenceShape?: 'circle' | 'polygon'
  geofenceDraftCoords?: [number, number][] | null
  showGeofenceDraftMarkers?: boolean
  geofenceRadius?: number
}>()

/*Emiten eventos de cancelacion de dibujo de geocerca y de actualizacion de coordenadas */
const emit = defineEmits<{
  cancelDrawing: []
  updateCoords: [coords: [number, number]]
  updateCenter: [coords: [number, number]]
  addBoundaryPoint: [coords: [number, number]]
  addGeofencePoint: [coords: [number, number]]
}>()

/* Objeto reactivo para la nueva geocerca */
const newZone = reactive({
  name: '',
  radius: 300,
  color: '#3b82f6',
  type: 'circle'
})

/*Manejo de logica para saber los nombres en las geocercas en las que se encuentra*/
/*ACA YA DEBERIA MANDARLO DESDE EL BACKEND (OJO POR REVISAR) */
const getZoneStatus = (route: ProcessedRoute) => {
  if (!route?.lastPoint) return { inside: false, names: [] as string[] }
  const [lat, lng] = route.lastPoint as [number, number]
  const names = geofences.value
    .filter(geofence => isInsideGeofence(geofence as Geofence, lat, lng))
    .map(geofence => geofence.nombre)
  return {
    inside: names.length > 0,
    names
  }
}

const getGeofenceCenter = (geofence: Geofence) => asLatLng(geofence.coords)
const getGeofencePolygon = (geofence: Geofence) => asPolygon(geofence.coords)

/*Disparador de eventos al hacer clic en el mapa */
const handleMapClick = (e: any) => {
  if (!isDrawing) return
  const coords: [number, number] = [e.latlng.lat, e.latlng.lng]

  if (drawMode === 'center') {
    emit('updateCenter', coords)
    return
  }

  if (drawMode === 'boundary') {
    emit('addBoundaryPoint', coords)
    return
  }

  if (drawMode === 'geofence' && geofenceShape === 'polygon') {
    emit('addGeofencePoint', coords)
    return
  }

  emit('updateCoords', coords)
}

/* Disparador para guardar la nueva geocerca */
const onSaveZone = async (finalData: ZoneSavePayload) => {
  if (!tempCoords) return
  const success = await saveGeofence({
    ...finalData,
    coords: tempCoords
  })
  if (success) resetDrawing()
}

/* Función para reiniciar el dibujo */
const resetDrawing = () => {
  emit('cancelDrawing')
}

/*Al montarse se inicia el streaming de datos en tiempo real
  -Primero se cargan los devices(Asignaciones de GPS -> Autos(Esto se ve en el filtro de datos))
  -Luego se cargan los datos del mapa (Rutas, posiciones, etc) por device
  -Luego se cargan las geocercas para mostrarlas en el mapa
*/

onMounted(async () => {
  if (enableRealtime) {
    if (!isStreaming.value) startRealtime()
    await fetchDevices()
    await Promise.all([
      fetchDeviceData({ showValidationAlert: false }),
      fetchGeofences()
    ])
  } else {
    await fetchGeofences()
  }
})

/*Al desmontarse se detiene el streaming de datos en tiempo real */
onUnmounted(() => {
  if (enableRealtime) stopRealtime()
  if (mapContainer && wheelBlocker) {
    mapContainer.removeEventListener('wheel', wheelBlocker)
  }
  if (mapContainer && gestureBlocker) {
    mapContainer.removeEventListener('gesturestart', gestureBlocker)
  }
  mapContainer = null
  wheelBlocker = null
  gestureBlocker = null
})

const lockedCenter = ref<[number, number] | null>(null)
const mapCenter = computed(() => {
  if (useBoundaryBounds && lockedCenter.value) return lockedCenter.value
  return centerOverride ?? center.value
})

const boundaryPolyline = computed(() => {
  if (!boundaryCoords?.length) return null
  return boundaryCoords
})

const boundaryPolygon = computed(() => {
  if (!boundaryCoords || boundaryCoords.length < 3) return null
  return boundaryCoords
})

const boundaryBounds = computed(() => {
  if (!boundaryCoords || boundaryCoords.length < 2) return null
  const lats = boundaryCoords.map(point => point[0])
  const lngs = boundaryCoords.map(point => point[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
})

const boundaryMask = computed(() => {
  if (!boundaryCoords || boundaryCoords.length < 3) return null
  const outerRing: [number, number][] = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180]
  ]
  return [outerRing, boundaryCoords]
})

const geofencePolyline = computed(() => {
  if (!geofenceDraftCoords?.length) return null
  return geofenceDraftCoords
})

const geofencePolygon = computed(() => {
  if (!geofenceDraftCoords || geofenceDraftCoords.length < 3) return null
  return geofenceDraftCoords
})

const mapRef = ref<any>(null)
const mapInstance = ref<any>(null)
const minZoom = ref<number | undefined>(undefined)
const mapZoom = ref(13)
const boundsApplied = ref(false)
let mapContainer: HTMLElement | null = null
let wheelBlocker: ((event: WheelEvent) => void) | null = null
let gestureBlocker: ((event: Event) => void) | null = null

const applyBoundaryConstraints = () => {
  if (!mapInstance.value || !useBoundaryBounds || !boundaryBounds.value) return
  const bounds = boundaryBounds.value
  mapInstance.value.setMaxBounds(bounds)
  mapInstance.value.options.maxBoundsViscosity = 1.0
  mapInstance.value.fitBounds(bounds, { padding: [24, 24] })
  const currentZoom = mapInstance.value.getZoom()
  minZoom.value = currentZoom
  mapZoom.value = currentZoom
  mapInstance.value.setMinZoom(currentZoom)
  mapInstance.value.setMaxZoom(currentZoom)
  const center = mapInstance.value.getCenter?.()
  if (center) {
    lockedCenter.value = [center.lat, center.lng]
  }
  mapInstance.value.dragging?.disable()
  mapInstance.value.scrollWheelZoom?.disable()
  mapInstance.value.touchZoom?.disable()
  mapInstance.value.doubleClickZoom?.disable()
  mapInstance.value.boxZoom?.disable()
  mapInstance.value.keyboard?.disable()
  boundsApplied.value = true
}

const onMapReady = (map: any) => {
  mapInstance.value = map
  mapInstance.value.options.scrollWheelZoom = false
  mapInstance.value.scrollWheelZoom?.disable()
  mapInstance.value.doubleClickZoom?.disable()
  mapInstance.value.boxZoom?.disable()
  mapInstance.value.keyboard?.disable()
  mapInstance.value.touchZoom?.disable()
  mapInstance.value.zoomControl?.remove()
  mapContainer = mapInstance.value.getContainer?.() ?? null
  if (mapContainer) {
    wheelBlocker = (event: WheelEvent) => {
      event.preventDefault()
    }
    gestureBlocker = (event: Event) => {
      event.preventDefault()
    }
    mapContainer.addEventListener('wheel', wheelBlocker, { passive: false })
    mapContainer.addEventListener('gesturestart', gestureBlocker)
  }
  if (!boundsApplied.value) applyBoundaryConstraints()
}

watch(() => boundaryCoords, () => {
  boundsApplied.value = false
  lockedCenter.value = null
  if (mapInstance.value && !boundsApplied.value) applyBoundaryConstraints()
})

</script>

<template>

  <LMap
    ref="mapRef"
    :zoom="mapZoom"
    :center="mapCenter"
    :use-global-leaflet="false"
    :class="isDrawing ? 'cursor-crosshair' : ''"
    :zoom-control="false"
    :scroll-wheel-zoom="false"
    :double-click-zoom="false"
    :box-zoom="false"
    :keyboard="false"
    :touch-zoom="false"
    :max-bounds="useBoundaryBounds ? (boundaryBounds || undefined) : undefined"
    :max-bounds-viscosity="useBoundaryBounds ? 1.0 : 0.0"
    :min-zoom="minZoom"
    @click="handleMapClick"
    @ready="onMapReady"
  >
    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
      layer-type="base"
    />
    <template
      v-for="z in geofences as Geofence[]"
      :key="z.id"
    >
      <LCircle
        v-if="z.tipo === 'circle' && getGeofenceCenter(z)"
        :lat-lng="getGeofenceCenter(z) as [number, number]"
        :radius="Number(z.radius) || 300"
        :color="z.color || '#3b82f6'"
        :fill-opacity="0.2"
      >
        <LPopup>
          <div class="p-3 flex flex-col gap-3 min-w-[150px]">
            <span
              class="text-[10px] font-bold uppercase text-gray-500 tracking-tight"
            >
              Editar Geocerca
            </span>

            <UInput
              v-model="z.nombre"
              size="xs"
              placeholder="Nombre..."
              @keyup.enter="updateGeofence(z.id, { nombre: z.nombre })"
            />

            <div class="flex gap-2 border-t pt-2">
              <UButton
                label="Guardar"
                icon="i-lucide-save"
                size="xs"
                block
                class="flex-1"
                @click="updateGeofence(z.id, { nombre: z.nombre })"
              />
              <UButton
                icon="i-lucide-trash"
                variant="soft"
                size="xs"
                @click="deleteGeofence(z.id)"
              />
            </div>
          </div>
        </LPopup>
        <LTooltip v-if="z.nombre">
          {{ z.nombre }}
        </LTooltip>
      </LCircle>

      <LPolygon
        v-else-if="getGeofencePolygon(z).length >= 3"
        :lat-lngs="getGeofencePolygon(z)"
        :color="z.color || '#3b82f6'"
        :fill-opacity="0.12"
      >
        <LPopup>
          <div class="p-3 flex flex-col gap-3 min-w-[150px]">
            <span
              class="text-[10px] font-bold uppercase text-gray-500 tracking-tight"
            >
              Editar Geocerca
            </span>

            <UInput
              v-model="z.nombre"
              size="xs"
              placeholder="Nombre..."
              @keyup.enter="updateGeofence(z.id, { nombre: z.nombre })"
            />

            <div class="flex gap-2 border-t pt-2">
              <UButton
                label="Guardar"
                icon="i-lucide-save"
                size="xs"
                block
                class="flex-1"
                @click="updateGeofence(z.id, { nombre: z.nombre })"
              />
              <UButton
                icon="i-lucide-trash"
                variant="soft"
                size="xs"
                @click="deleteGeofence(z.id)"
              />
            </div>
          </div>
        </LPopup>
        <LTooltip v-if="z.nombre">
          {{ z.nombre }}
        </LTooltip>
      </LPolygon>
    </template>
  
    <ZoneMarker
      v-if="useZoneMarker && isDrawing && drawMode === 'geofence' && geofenceShape === 'circle'"
      v-model:radius="newZone.radius"
      :coords="tempCoords"
      :color="newZone.color"
      :is-saving="isSaving"
      @save="onSaveZone"
      @cancel="resetDrawing"
    />

    <LCircle
      v-if="isDrawing && drawMode === 'geofence' && geofenceShape === 'circle' && tempCoords"
      :lat-lng="tempCoords"
      :radius="Number(geofenceRadius || newZone.radius)"
      :color="newZone.color || '#3b82f6'"
      :fill-opacity="0.12"
      :dash-array="'8, 8'"
    />

    <LMarker
      v-if="centerMarker"
      :lat-lng="centerMarker"
    >
      <LIcon
        :icon-size="[18, 18]"
        :icon-anchor="[9, 9]"
        class-name="clear-marker"
      >
        <div class="w-4 h-4 rounded-full bg-slate-700 border-2 border-white shadow-md"></div>
      </LIcon>
      <LTooltip :options="{ sticky: true }">
        <span class="text-[10px] font-bold uppercase">Centro</span>
      </LTooltip>
    </LMarker>

    <LPolyline
      v-if="boundaryPolyline"
      :lat-lngs="boundaryPolyline"
      color="#475569"
      :weight="3"
      :dash-array="'6, 6'"
    />

    <LPolygon
      v-if="boundaryPolygon"
      :lat-lngs="boundaryPolygon"
      color="#475569"
      :fill-opacity="0.08"
    />

    <LPolygon
      v-if="showBoundaryMask && boundaryMask"
      :lat-lngs="boundaryMask"
      :stroke="false"
      :fill-opacity="0.55"
      :fill-color="'#0f172a'"
    />

    <LCircleMarker
      v-for="(point, index) in (showBoundaryMarkers && boundaryCoords ? boundaryCoords : [])"
      :key="`boundary-${index}`"
      :lat-lng="point"
      :radius="4"
      :color="'#475569'"
      :fill-color="'#cbd5e1'"
      :fill-opacity="0.9"
    />

    <LPolyline
      v-if="isDrawing && drawMode === 'geofence' && geofenceShape === 'polygon' && geofencePolyline"
      :lat-lngs="geofencePolyline"
      color="#475569"
      :weight="3"
      :dash-array="'6, 6'"
    />

    <LPolygon
      v-if="isDrawing && drawMode === 'geofence' && geofenceShape === 'polygon' && geofencePolygon"
      :lat-lngs="geofencePolygon"
      color="#475569"
      :fill-opacity="0.12"
    />

    <LCircleMarker
      v-for="(point, index) in (showGeofenceDraftMarkers && geofenceDraftCoords ? geofenceDraftCoords : [])"
      :key="`geofence-${index}`"
      :lat-lng="point"
      :radius="4"
      :color="'#475569'"
      :fill-color="'#cbd5e1'"
      :fill-opacity="0.95"
    />

    <template
      v-if="showRoutes"
    >
      <template
        v-for="route in processedRoutes"
        :key="route.id"
      >
        <LPolyline
          v-if="route.points.length > 0"
          :lat-lngs="route.points"
          :color="route.color"
          :weight="3"
          z-index="1000"
        />

        <LMarker
          v-if="route.lastPoint"
          :lat-lng="route.lastPoint"
        >
        <LIcon
          :icon-size="[35, 35]"
          :icon-anchor="[20, 40]"
          class-name="clear-marker"
        >
          <CarIcon
            :color="route.color"
            :size="40"
          />
        </LIcon>
        <LTooltip :options="{ sticky: true }">
          <div class="w-72 p-1 select-none font-sans bg-transparent text-black">
            <div class="flex justify-between items-center mb-3 px-1">
              <div>
                <p
                  class="text-[9px] font-black text-blue-700 uppercase tracking-widest leading-none"
                >
                  Unidad #{{ route.id.slice(-4) }}
                </p>
                <h3 class="text-xl font-black tracking-tighter">
                  {{ route.name }}
                </h3>
              </div>
              <span
                :class="[
                  'text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-white',
                  route.status === 'online' ? 'bg-green-600' : 'bg-slate-600'
                ]"
              >
                {{ route.status === "online" ? "Online" : "Offline" }}
              </span>
            </div>

            <div class="mb-4 px-1">
              <p
                class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1"
              >
                Última velocidad registrada
              </p>
              <div class="flex items-baseline gap-1">
                <span
                  class="text-4xl font-black tracking-tighter leading-none"
                >{{ route.speed }}</span>
                <span class="text-base font-black text-slate-400 uppercase">km/h</span>
              </div>
            </div>

            <div
              class="flex items-center gap-6 px-1 mb-5 py-2 border-y border-slate-100"
            >
              <div class="flex-1 border-r border-slate-200">
                <p
                  class="text-[9px] font-black uppercase text-slate-500 mb-0.5 tracking-tight"
                >
                  V. Máxima
                </p>
                <div class="flex flex-col">
                  <span class="text-xl font-black leading-none">{{ route.maxSpeed
                  }}<small class="text-[10px] ml-0.5 font-bold uppercase">km/h</small></span>
                  <span
                    class="text-[8px] font-black text-blue-700 uppercase mt-0.5 italic leading-none"
                  >{{ route.maxSpeedTime }}</span>
                </div>
              </div>
              <div class="flex-1">
                <p
                  class="text-[9px] font-black uppercase text-slate-500 mb-0.5 tracking-tight"
                >
                  V. Promedio
                </p>
                <span class="text-xl font-black leading-none">{{ route.avgSpeed
                }}<small class="text-[10px] ml-0.5 uppercase font-bold">km/h</small></span>
              </div>
            </div>

            <div class="space-y-3 px-1 mb-4">
              <div class="relative pl-3 border-l-2 border-blue-600">
                <div
                  class="flex justify-between text-[9px] font-black uppercase mb-1"
                >
                  <span>Última Posición</span>
                  <span class="text-blue-700 bg-blue-50 px-1 rounded">{{
                    route.lastTime
                  }}</span>
                </div>
                <p
                  class="text-[11px] font-mono font-bold text-slate-700 leading-none truncate"
                >
                  {{ route.lastCoords }}
                </p>
              </div>
              <div class="relative pl-3 border-l-2 border-slate-200">
                <div
                  class="flex justify-between text-[9px] font-black uppercase mb-1 text-slate-500"
                >
                  <span>Anterior</span>
                  <span class="tracking-tighter">{{ route.prevTime }}</span>
                </div>
                <p
                  class="text-[11px] font-mono font-bold text-slate-400 leading-none truncate"
                >
                  {{ route.prevCoords }}
                </p>
              </div>
            </div>

            <div
              class="pt-2 border-t border-slate-100 flex justify-between items-center px-1"
            >
              <span
                class="text-[10px] font-black uppercase tracking-widest text-slate-800"
              >Inactividad</span>
              <span class="text-lg font-black text-orange-600 leading-none">{{ route.stopTime.toFixed(1) }}
                <small class="text-[10px]">HRS</small></span>
            </div>

            <div class="mt-3 px-1 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Zona</span>
                <span
                  :class="[
                    'text-[10px] font-black uppercase px-2 py-0.5 rounded',
                    getZoneStatus(route).inside ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ getZoneStatus(route).inside ? 'Dentro' : 'Fuera' }}
                </span>
              </div>
              <p v-if="getZoneStatus(route).inside" class="text-[10px] mt-1 text-slate-600 truncate">
                {{ getZoneStatus(route).names.join(', ') }}
              </p>
            </div>
          </div>
        </LTooltip>
        </LMarker>
      </template>
    </template>
  </LMap>
</template>
