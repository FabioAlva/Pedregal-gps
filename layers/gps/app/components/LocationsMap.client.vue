<script lang="ts" setup>
import { useMap } from '#layers/gps/app/composables/useMap'
import { useGpsRealtime } from '#layers/gps/app/composables/useGpsRealtime'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useFields } from '#layers/gps/app/composables/useFields'
import CarIcon from '#layers/gps/app/components/CarIcon.vue'
import ZoneMarker from '#layers/gps/app/components/ZoneMarker.vue'
import type { Field } from '#shared/types/db'
import { asPolygon, circleToPolygon, isInsideField } from '#layers/gps/app/utils/field-geometry'
import type { ProcessedRoute } from '../types/IMap'

const { fetchDevices } = useFilter()
const { fetchDeviceData, center, processedRoutes } = useMap()
const { stopRealtime, startRealtime, isStreaming } = useGpsRealtime()
const {
  fields,
  isSaving,
  saveField,
  fetchFields,
  updateField,
  deleteField
} = useFields()

type SaveFieldPayload = Parameters<typeof saveField>[0]
type ZoneSavePayload = Omit<SaveFieldPayload, 'coords'> & { radius?: number }

const props = withDefaults(defineProps<{
  isDrawing: boolean
  tempCoords: [number, number] | null
  drawMode?: 'field' | 'center' | 'boundary'
  showRoutes?: boolean
  enableRealtime?: boolean
  centerOverride?: [number, number] | null
  centerMarker?: [number, number] | null
  boundaryCoords?: [number, number][] | null
  showBoundaryMarkers?: boolean
  useBoundaryBounds?: boolean
  showBoundaryMask?: boolean
  showBoundaryOverlay?: boolean
  enforceMaxBounds?: boolean
  showFieldMask?: boolean
  useZoneMarker?: boolean
  fieldShape?: 'circle' | 'polygon'
  fieldDraftCoords?: [number, number][] | null
  showFieldDraftMarkers?: boolean
  fieldRadius?: number
  invalidateSizeKey?: number
}>(), {
  drawMode: 'field',
  showRoutes: true,
  enableRealtime: true,
  fieldShape: 'circle',
  fieldRadius: 300,
  useZoneMarker: true,
  showFieldMask: false,
  showBoundaryOverlay: true,
  enforceMaxBounds: true
})

const emit = defineEmits<{
  cancelDrawing: []
  updateCoords: [coords: [number, number]]
  updateCenter: [coords: [number, number]]
  addBoundaryPoint: [coords: [number, number]]
  addFieldPoint: [coords: [number, number]]
}>()

const newZone = reactive({
  name: '',
  radius: 300,
  color: '#3b82f6',
  type: 'circle'
})

const getZoneStatus = (route: ProcessedRoute) => {
  if (!route?.lastPoint) return { inside: false, names: [] as string[] }
  const [lat, lng] = route.lastPoint as [number, number]
  const names = fields.value
    .filter(field => isInsideField(field as Field, lat, lng))
    .map(field => field.nombre)
  return { inside: names.length > 0, names }
}

const getFieldPolygon = (field: Field) => asPolygon(field.coords)

const getFieldCenter = (field: Field) => {
  const polygon = getFieldPolygon(field)
  if (!polygon.length) return null

  let area = 0
  let x = 0
  let y = 0

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[j]
    const [lat2, lng2] = polygon[i]
    const f = lng1 * lat2 - lng2 * lat1
    x += (lng1 + lng2) * f
    y += (lat1 + lat2) * f
    area += f
  }

  area *= 0.5
  if (area === 0) {
    const avgLat = polygon.reduce((acc, [lat]) => acc + lat, 0) / polygon.length
    const avgLng = polygon.reduce((acc, [, lng]) => acc + lng, 0) / polygon.length
    return [avgLat, avgLng] as [number, number]
  }

  return [y / (6 * area), x / (6 * area)] as [number, number]
}

const getIgnitionOffSegments = (route: ProcessedRoute) => {
  if (!route.rawPoints?.length) return [] as [number, number][][]
  const segments: [number, number][][] = []
  let current: [number, number][] = []

  route.rawPoints.forEach(point => {
    const isOff = point.ignition === 0
    if (isOff) {
      current.push([point.lat, point.lng])
      return
    }
    if (current.length >= 2) segments.push(current)
    current = []
  })

  if (current.length >= 2) segments.push(current)
  return segments
}

const handleMapClick = (e: any) => {
  if (!props.isDrawing) return
  const coords: [number, number] = [e.latlng.lat, e.latlng.lng]

  if (props.drawMode === 'center') { emit('updateCenter', coords); return }
  if (props.drawMode === 'boundary') { emit('addBoundaryPoint', coords); return }
  if (props.drawMode === 'field' && props.fieldShape === 'polygon') {
    emit('addFieldPoint', coords)
    return
  }
  emit('updateCoords', coords)
}

const onSaveZone = async (finalData: ZoneSavePayload) => {
  if (!props.tempCoords) return
  const radius = Number(finalData.radius ?? newZone.radius ?? props.fieldRadius ?? 300)
  const polygon = circleToPolygon(props.tempCoords, radius)
  const success = await saveField({
    ...finalData,
    coords: polygon,
    categoria: 'CAMPO'
  })
  if (success) resetDrawing()
}

const resetDrawing = () => emit('cancelDrawing')

onMounted(async () => {
  if (props.enableRealtime) {
    if (!isStreaming.value) startRealtime()
    await fetchDevices()
    await Promise.all([
      fetchDeviceData({ showValidationAlert: false }),
      fetchFields()
    ])
  } else {
    await fetchFields()
  }
})

onUnmounted(() => {
  if (props.enableRealtime) stopRealtime()
})

const mapCenter = computed(() => props.centerOverride ?? center.value)
const boundaryRectangle = computed(() => {
  if (!props.boundaryCoords || props.boundaryCoords.length < 2) return null
  const lats = props.boundaryCoords.map(point => point[0])
  const lngs = props.boundaryCoords.map(point => point[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  return [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, maxLng],
    [maxLat, minLng]
  ] as [number, number][]
})

const boundaryPolyline = computed(() => {
  if (!props.boundaryCoords?.length) return null
  if (props.boundaryCoords.length >= 3) return props.boundaryCoords
  return boundaryRectangle.value
})

const boundaryPolygon = computed(() => {
  if (!props.boundaryCoords?.length) return null
  if (props.boundaryCoords.length >= 3) return props.boundaryCoords
  return boundaryRectangle.value
})

const boundaryBounds = computed(() => {
  if (!props.boundaryCoords || props.boundaryCoords.length < 2) return null
  const lats = props.boundaryCoords.map(point => point[0])
  const lngs = props.boundaryCoords.map(point => point[1])
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]] as [[number, number], [number, number]]
})

const boundaryMask = computed(() => {
  if (!props.boundaryCoords || props.boundaryCoords.length < 2) return null
  const mask = boundaryPolygon.value
  if (!mask) return null
  return [[[90, -180], [90, 180], [-90, 180], [-90, -180]], mask]
})

const fieldMask = computed(() => {
  const polygons = fields.value
    .filter(field => field.tipo === 'DELIMITADOR')
    .map(getFieldPolygon)
    .filter(polygon => polygon.length >= 3)
  if (!polygons.length) return null
  const worldRing: [number, number][] = [[90, -180], [90, 180], [-90, 180], [-90, -180]]
  return [worldRing, ...polygons]
})

const sortedFields = computed(() => {
  const delimiters = fields.value.filter(field => field.tipo === 'DELIMITADOR')
  const others = fields.value.filter(field => field.tipo !== 'DELIMITADOR')
  return [...delimiters, ...others]
})

const fieldPolyline = computed(() => props.fieldDraftCoords?.length ? props.fieldDraftCoords : null)
const fieldPolygon = computed(() => (props.fieldDraftCoords && props.fieldDraftCoords.length >= 3) ? props.fieldDraftCoords : null)

const mapInstance = ref<any>(null)
const minZoom = ref<number | undefined>(undefined)
const maxZoom = ref<number | undefined>(undefined)
const mapZoom = ref(13)
const boundsApplied = ref(false)
const FIXED_MIN_ZOOM = 14.3
let resizeObserver: ResizeObserver | null = null

const applyBoundaryConstraints = () => {
  if (!mapInstance.value) return
  if (props.useBoundaryBounds && boundaryBounds.value && props.enforceMaxBounds) {
    mapInstance.value.setMaxBounds(boundaryBounds.value)
    mapInstance.value.options.maxBoundsViscosity = 1.0
  }
  minZoom.value = FIXED_MIN_ZOOM
  mapInstance.value.setMinZoom(FIXED_MIN_ZOOM)
  boundsApplied.value = true
}

const onMapReady = (map: any) => {
  mapInstance.value = map
  if (!boundsApplied.value) applyBoundaryConstraints()
  if (typeof ResizeObserver !== 'undefined') {
    const container = mapInstance.value.getContainer?.()
    if (container) {
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(() => {
        mapInstance.value?.invalidateSize({ animate: false })
      })
      resizeObserver.observe(container)
    }
  }
}

watch(() => props.boundaryCoords, () => {
  boundsApplied.value = false
  if (mapInstance.value) applyBoundaryConstraints()
}, { deep: true })

watch(() => props.invalidateSizeKey, async () => {
  if (!mapInstance.value) return
  await nextTick()
  mapInstance.value.invalidateSize({ animate: false })
})
</script>

<template>
  <LMap
    :zoom="mapZoom"
    :center="mapCenter"
    :use-global-leaflet="false"
    :class="isDrawing ? 'cursor-crosshair' : ''"
    :style="showBoundaryMask ? { backgroundColor: '#000000' } : undefined"
    :zoom-control="true"
    :max-bounds="useBoundaryBounds && enforceMaxBounds ? (boundaryBounds || undefined) : undefined"
    :max-bounds-viscosity="useBoundaryBounds && enforceMaxBounds ? 1.0 : 0.0"
    :min-zoom="minZoom"
    :max-zoom="maxZoom"
    :zoom-snap="0.1"
    :zoom-delta="0.5"
    :scroll-wheel-zoom="true"
    :double-click-zoom="true"
    :box-zoom="true"
    :keyboard="true"
    :touch-zoom="true"
    @click="handleMapClick"
    @ready="onMapReady"
  >
    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      :no-wrap="true"
      :opacity="0.4"
      layer-type="base"
    />

    <template v-for="field in sortedFields" :key="field.id">
      <LPolygon
        v-if="getFieldPolygon(field).length >= 3"
        :lat-lngs="getFieldPolygon(field)"
        :color="field.color || '#3b82f6'"
        :fill-opacity="0.18"
        :weight="1"
      >
        <LPopup>
          <div class="p-3 flex flex-col gap-3 min-w-[150px]">
            <span class="text-[10px] font-bold uppercase text-gray-500 tracking-tight">Editar Campo</span>
            <UInput v-model="field.nombre" size="xs" @keyup.enter="updateField(field.id, { nombre: field.nombre })" />
            <div class="flex items-center gap-2">
              <UInput v-model="field.color" type="color" class="w-10 h-8 p-0 overflow-hidden" />
              <UInput v-model="field.color" size="xs" placeholder="#3b82f6" class="flex-1" />
            </div>
            <div class="flex gap-2 border-t pt-2">
              <UButton label="Guardar" icon="i-lucide-save" size="xs" block class="flex-1" @click="updateField(field.id, { nombre: field.nombre, color: field.color })" />
              <UButton icon="i-lucide-trash" variant="soft" color="red" size="xs" @click="deleteField(field.id)" />
            </div>
          </div>
        </LPopup>
      </LPolygon>
      <LMarker v-if="field.nombre && field.tipo !== 'DELIMITADOR' && getFieldCenter(field)" :lat-lng="getFieldCenter(field)">
        <LIcon :icon-size="[1, 1]" :icon-anchor="[0, 0]" class-name="clear-marker">
          <div class="field-label-inline">
            {{ field.nombre }}
          </div>
        </LIcon>
      </LMarker>
    </template>

    <ZoneMarker
      v-if="useZoneMarker && isDrawing && drawMode === 'field' && fieldShape === 'circle'"
      v-model:radius="newZone.radius"
      :coords="tempCoords"
      :color="newZone.color"
      :is-saving="isSaving"
      @save="onSaveZone"
      @cancel="resetDrawing"
    />

    <LCircle
      v-if="isDrawing && drawMode === 'field' && fieldShape === 'circle' && tempCoords"
      :lat-lng="tempCoords"
      :radius="Number(fieldRadius || newZone.radius)"
      :color="newZone.color || '#3b82f6'"
      :fill-opacity="0.05"
      :weight="1"
      :dash-array="'8, 8'"
    />

    <LMarker v-if="centerMarker" :lat-lng="centerMarker">
      <LIcon :icon-size="[18, 18]" :icon-anchor="[9, 9]" class-name="clear-marker">
        <div class="w-4 h-4 rounded-full bg-slate-700 border-2 border-white shadow-md"></div>
      </LIcon>
    </LMarker>

    <LPolyline v-if="showBoundaryOverlay && boundaryPolyline" :lat-lngs="boundaryPolyline" color="#475569" :weight="2" :dash-array="'6, 6'" />
    <LPolygon v-if="showBoundaryOverlay && boundaryPolygon" :lat-lngs="boundaryPolygon" color="#475569" :fill-opacity="0.04" :weight="1" />
    <LPolygon v-if="showBoundaryMask && boundaryMask" :lat-lngs="boundaryMask" :stroke="false" :fill-opacity="1" fill-color="#000000" />
    <LPolygon v-if="showFieldMask && fieldMask" :lat-lngs="fieldMask" :stroke="false" :fill-opacity="1" fill-color="#ffffff" />

    <template v-if="showRoutes">
      <template v-for="route in processedRoutes" :key="route.id">
        <LPolyline
          v-if="route.points.length > 0"
          :lat-lngs="route.points"
          color="#94a3b8"
          :weight="1.5"
          :opacity="0.25"
          :line-cap="'round'"
          :line-join="'round'"
        />
        <LPolyline
          v-if="route.points.length > 0"
          :lat-lngs="route.points"
          :color="route.color"
          :weight="1.5"
          :opacity="0.85"
          :line-cap="'round'"
          :line-join="'round'"
        />
        <template v-for="(segment, idx) in getIgnitionOffSegments(route)" :key="`${route.id}-off-${idx}`">
          <LPolyline
            :lat-lngs="segment"
            color="#2563eb"
            :weight="1.5"
            :opacity="0.95"
            :line-cap="'round'"
            :line-join="'round'"
          />
        </template>
        <LMarker v-if="route.lastPoint" :lat-lng="route.lastPoint">
          <LIcon :icon-size="[35, 35]" :icon-anchor="[20, 40]" class-name="clear-marker">
            <CarIcon :color="route.color" :size="25" />
          </LIcon>
          <LTooltip :options="{ sticky: true }">
            <div class="w-72 p-1 select-none font-sans bg-transparent text-black">
              <div class="flex justify-between items-center mb-3 px-1">
                <div>
                  <p class="text-[9px] font-black text-blue-700 uppercase tracking-widest leading-none">
                    Unidad #{{ route.id.slice(-4) }}
                  </p>
                  <h3 class="text-xl font-black tracking-tighter">
                    {{ route.name }}
                  </h3>
                </div>
                <span :class="[
                  'text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-white',
                  route.status === 'encendido'
                    ? 'bg-green-600'
                    : route.status === 'apagado'
                      ? 'bg-slate-600'
                      : 'bg-slate-500'
                ]">
                  {{ route.status === 'encendido' ? 'Encendido' : route.status === 'apagado' ? 'Apagado' : 'Sin senal' }}
                </span>
              </div>

              <div class="mb-4 px-1">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Ultima velocidad registrada
                </p>
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl font-black tracking-tighter leading-none">{{ route.speed }}</span>
                  <span class="text-base font-black text-slate-400 uppercase">km/h</span>
                </div>
              </div>

              <div class="flex items-center gap-6 px-1 mb-5 py-2 border-y border-slate-100">
                <div class="flex-1 border-r border-slate-200">
                  <p class="text-[9px] font-black uppercase text-slate-500 mb-0.5 tracking-tight">
                    V. Maxima
                  </p>
                  <div class="flex flex-col">
                    <span class="text-xl font-black leading-none">{{ route.maxSpeed }}<small class="text-[10px] ml-0.5 font-bold uppercase">km/h</small></span>
                    <span class="text-[8px] font-black text-blue-700 uppercase mt-0.5 italic leading-none">{{ route.maxSpeedTime }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-[9px] font-black uppercase text-slate-500 mb-0.5 tracking-tight">
                    V. Promedio
                  </p>
                  <span class="text-xl font-black leading-none">{{ route.avgSpeed }}<small class="text-[10px] ml-0.5 uppercase font-bold">km/h</small></span>
                </div>
              </div>

              <div class="space-y-3 px-1 mb-4">
                <div class="relative pl-3 border-l-2 border-blue-600">
                  <div class="flex justify-between text-[9px] font-black uppercase mb-1">
                    <span>Ultima Posicion</span>
                    <span class="text-blue-700 bg-blue-50 px-1 rounded">{{ route.lastTime }}</span>
                  </div>
                  <p class="text-[11px] font-mono font-bold text-slate-700 leading-none truncate">
                    {{ route.lastCoords }}
                  </p>
                </div>
                <div class="relative pl-3 border-l-2 border-slate-200">
                  <div class="flex justify-between text-[9px] font-black uppercase mb-1 text-slate-500">
                    <span>Anterior</span>
                    <span class="tracking-tighter">{{ route.prevTime }}</span>
                  </div>
                  <p class="text-[11px] font-mono font-bold text-slate-400 leading-none truncate">
                    {{ route.prevCoords }}
                  </p>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-100 flex justify-between items-center px-1">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Inactividad</span>
                <span class="text-lg font-black text-orange-600 leading-none">{{ route.stopTime.toFixed(1) }}
                  <small class="text-[10px]">HRS</small></span>
              </div>

              <div class="mt-3 px-1 pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Zona</span>
                  <span :class="[
                    'text-[10px] font-black uppercase px-2 py-0.5 rounded',
                    getZoneStatus(route).inside ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  ]">
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

<style>
.field-label {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 6px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 4px 8px;
  text-transform: uppercase;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.leaflet-tooltip.field-label {
  pointer-events: none;
}

.field-label-inline {
  background: transparent;
  border: 0;
  border-radius: 0;
  color: #0f172a;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 0;
  text-transform: uppercase;
  box-shadow: none;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  pointer-events: none;
}

</style>