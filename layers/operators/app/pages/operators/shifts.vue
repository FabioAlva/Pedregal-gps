<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { useOperators } from '../../composables/useOperators'
import { useOperatorShifts } from '../../composables/useOperatorShifts'


const { operators, fetchOperators } = useOperators()
const { shifts, fetchShifts, createShift, updateShift } = useOperatorShifts()

const fleets = ref<{ label: string; value: number }[]>([])

// Mock data for a full preview while APIs are empty.
const mockOperators = [
  { id: 1, nombres: 'Luis', apellidos: 'Mendoza' },
  { id: 2, nombres: 'Karla', apellidos: 'Ruiz' },
  { id: 3, nombres: 'Rafael', apellidos: 'Nunez' },
  { id: 4, nombres: 'Miguel', apellidos: 'Pardo' }
]

const mockFleets = [
  { label: 'T-902', value: 101 },
  { label: 'C-441', value: 102 },
  { label: 'T-114', value: 103 },
  { label: 'C-772', value: 104 }
]

const mockShifts = [
  {
    id: 9001,
    operadorId: 1,
    flotaId: 101,
    operadorNombres: 'Luis',
    operadorApellidos: 'Mendoza',
    placa: 'T-902',
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 9002,
    operadorId: 2,
    flotaId: 102,
    operadorNombres: 'Karla',
    operadorApellidos: 'Ruiz',
    placa: 'C-441',
    fechaInicio: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    fechaFin: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 9003,
    operadorId: 3,
    flotaId: 103,
    operadorNombres: 'Rafael',
    operadorApellidos: 'Nunez',
    placa: 'T-114',
    fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    fechaFin: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 9004,
    operadorId: 4,
    flotaId: 104,
    operadorNombres: 'Miguel',
    operadorApellidos: 'Pardo',
    placa: 'C-772',
    fechaInicio: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    fechaFin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
]

const isModalOpen = ref(false)
const isDetailOpen = ref(false)
const isTestModalOpen = ref(false)
const selectedEvent = ref<{
  title: string
  start: string
  end: string
  placa: string
  operador: string
} | null>(null)
const form = ref({
  operadorId: null as number | null,
  flotaId: null as number | null,
  fechaInicio: '',
  fechaFin: ''
})

const toLocalInput = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const fromLocalInput = (value: string) => {
  if (!value) return ''
  return new Date(value).toISOString()
}

const openCreateModal = (selection?: { start: Date; end: Date }) => {
  if (selection) {
    form.value.fechaInicio = toLocalInput(selection.start.toISOString())
    form.value.fechaFin = toLocalInput(selection.end.toISOString())
  }
  isModalOpen.value = true
}

const handleCellClick = (date: Date) => {
  const end = new Date(date.getTime() + 60 * 60 * 1000)
  openCreateModal({ start: date, end })
}

const resetForm = () => {
  form.value = { operadorId: null, flotaId: null, fechaInicio: '', fechaFin: '' }
}

const closeCreateModal = () => {
  isModalOpen.value = false
}

const handleSave = async () => {
  if (!form.value.operadorId || !form.value.flotaId) return
  if (!form.value.fechaInicio || !form.value.fechaFin) return

  const ok = await createShift({
    operadorId: form.value.operadorId,
    flotaId: form.value.flotaId,
    fechaInicio: fromLocalInput(form.value.fechaInicio),
    fechaFin: fromLocalInput(form.value.fechaFin)
  })

  if (ok) {
    closeCreateModal()
    resetForm()
  }
}

const handleEventChange = async (event: { id: number; start: Date; end?: Date }) => {
  const start = event.start?.toISOString()
  const end = event.end?.toISOString() || event.start?.toISOString()
  if (!start || !end) return
  await updateShift(event.id, { fechaInicio: start, fechaFin: end })
}

const handleEventClick = (event: { title: string; start: Date; end?: Date; placa: string; operador: string }) => {
  selectedEvent.value = {
    title: event.title,
    start: event.start.toISOString(),
    end: (event.end || event.start).toISOString(),
    placa: event.placa,
    operador: event.operador
  }
  isDetailOpen.value = true
}

onMounted(async () => {
  await Promise.all([fetchOperators(), fetchShifts()])
  const fleetData = await $fetch<{ id: number; placa: string }[]>('/api/fleets')
  fleets.value = fleetData.map(item => ({ label: item.placa, value: item.id }))
})

const operatorOptions = computed(() =>
  (operators.value.length ? operators.value : mockOperators)
    .map(op => ({ label: `${op.nombres} ${op.apellidos}`.trim(), value: op.id }))
)

const activeFleets = computed(() => (fleets.value.length ? fleets.value : mockFleets))
const activeShifts = computed(() => (shifts.value.length ? shifts.value : mockShifts))

const calendarEvents = computed(() => activeShifts.value.map(shift => ({
  id: shift.id,
  title: `${shift.operadorNombres} ${shift.operadorApellidos} · ${shift.placa}`.trim(),
  start: new Date(shift.fechaInicio),
  end: new Date(shift.fechaFin ?? shift.fechaInicio),
  placa: shift.placa,
  operador: `${shift.operadorNombres} ${shift.operadorApellidos}`.trim()
})))


const onEventDrop = (payload: { event: { id: number; start: Date; end?: Date } }) => {
  handleEventChange(payload.event)
}

const onEventClick = (payload: any) => {
  const event = payload?.event ?? payload
  if (!event?.start) return
  handleEventClick(event)
}

</script>

<template>
<div class="w-full flex flex-col font-sans text-slate-900 overflow-hidden h-full">  
   <header class="flex flex-col w-full mb-6 shrink-0">
      
      <div class="pb-3 pl-1">
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <span>Capital Humano</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-40" />
          <span class="text-slate-900">Asignaciones</span>
        </nav>
      </div>

      <div class="w-full flex items-center bg-white border border-slate-300 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 rounded-none transition-colors">
        
        <UInput 
          variant="none" 
          placeholder="Buscar asignación..." 
          icon="i-lucide-search" 
          class="flex-1 font-medium"
          :ui="{ wrapper: 'flex-1', base: 'w-full h-11 rounded-none text-sm bg-transparent' }"
        />
        
        <div class="w-px h-6 bg-slate-300 mx-2" />
        
        <UButton 
          color="brand" 
          icon="i-lucide-plus" 
          class="px-8 h-11 text-xs font-bold text-white bg-primary rounded-none" 
          label="Nuevo Turno" 
          @click="openCreateModal()" 
        />
        
      </div>
      
    </header>

    <div class="flex-1 min-h-0">
      <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-4 overflow-auto h-full min-h-[520px]">
        <ClientOnly>
          <VueCal
            class="h-full"
            :events="calendarEvents"
            :time-from="6 * 60"
            :time-to="22 * 60"
            :editable-events="true"
            :snap-to-time="30"
            active-view="week"
            :views="['week']"
            :hide-view-selector="true"
            @event-drop="onEventDrop"
            @event-resize="onEventDrop"
            @cell-click="handleCellClick"
            @event-click="onEventClick"
          >
            <template #event="{ event }">
              <div class="text-[10px] font-black leading-tight">{{ event.operador }}</div>
              <div class="text-[9px] uppercase tracking-widest text-slate-600">{{ event.placa }}</div>
            </template>
          </VueCal>
        </ClientOnly>
    </div>

    <UModal v-model:open="isModalOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
      <template #content>
        <div class="relative w-full max-w-[720px] bg-white shadow-2xl rounded-[32px] overflow-hidden">
          <div class="bg-slate-950 p-8 text-white shrink-0 relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-60 h-60 bg-brand-500/10 blur-[120px] rounded-full" />
            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <UIcon name="i-lucide-calendar-clock" class="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Nuevo Turno</span>
                  <h3 class="text-2xl font-black tracking-tight mt-2">Asignacion de Operador</h3>
                  <p class="text-xs text-slate-300">Programa el horario y la unidad.</p>
                </div>
              </div>
              <UButton icon="i-lucide-x" color="white" variant="ghost" @click="closeCreateModal" />
            </div>
          </div>

          <div class="p-8 space-y-6">
            <UFormField label="Operador">
              <USelect v-model="form.operadorId" :items="operatorOptions" placeholder="Selecciona operador" />
            </UFormField>

            <UFormField label="Unidad">
              <USelect v-model="form.flotaId" :items="activeFleets" placeholder="Selecciona unidad" />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Inicio">
                <UInput v-model="form.fechaInicio" type="datetime-local" />
              </UFormField>
              <UFormField label="Fin">
                <UInput v-model="form.fechaFin" type="datetime-local" />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" label="Cancelar" @click="closeCreateModal" />
              <UButton color="brand" label="Guardar" @click="handleSave" />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <Transition name="drawer">
      <div v-if="isDetailOpen" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="isDetailOpen = false" />

        <div class="relative w-full max-w-[75%] lg:max-w-[40%] h-full bg-white shadow-2xl flex flex-col">
          <div class="bg-slate-950 p-10 text-white shrink-0 relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full" />
            <div class="relative z-10 flex items-start justify-between">
              <div>
                <h3 class="text-3xl font-black tracking-tight">Turno programado</h3>
                <div class="flex items-center gap-3 mt-2">
                  <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ selectedEvent?.id || '-' }}</span>
                  <span class="text-slate-400 text-xs font-mono uppercase">{{ selectedEvent?.placa || 'Sin unidad' }}</span>
                </div>
              </div>
              <UButton icon="i-lucide-x" color="white" variant="ghost" size="xl" @click="isDetailOpen = false" />
            </div>
          </div>

          <div v-if="selectedEvent" class="flex-1 overflow-y-auto p-10 space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-400">Operador</p>
                <p class="font-semibold text-slate-900">{{ selectedEvent.operador }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-400">Unidad</p>
                <p class="font-semibold text-slate-900">{{ selectedEvent.placa }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-400">Inicio</p>
                <p class="font-mono text-xs text-slate-700">{{ new Date(selectedEvent.start).toLocaleString() }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-400">Fin</p>
                <p class="font-mono text-xs text-slate-700">{{ new Date(selectedEvent.end).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <UModal v-model:open="isTestModalOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
      <template #content>
        <div class="w-full max-w-[520px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
          <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold">Modal de prueba</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isTestModalOpen = false" />
          </div>
          <p class="text-sm text-slate-600">Si este modal queda debajo del contenido, hay un problema con el overlay/portal.</p>
          <div class="flex justify-end">
            <UButton color="brand" label="Cerrar" @click="isTestModalOpen = false" />
          </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
    </div>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>
