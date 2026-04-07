<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Equipment } from '~~/shared/types/db' 
import type { Assignment } from '#layers/gps/app/types/ITeemFleet' 
import { useTeamFleet } from '#layers/fleet-management/app/composable/useTeamFeet'
import { parseLocalDateStr } from '#layers/gps/app/utils/FormatTime'

const props = defineProps<{
  modelValue: boolean
  equipment: Equipment | null
}>()

const emit = defineEmits(['update:modelValue', 'disconnect', 'assign'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { getAssignmentsByGpsId } = useTeamFleet()

const deviceHistory = ref<Assignment[]>([])
const isLoadingHistory = ref(false)

// Cargar historial del GPS seleccionado
watch(isOpen, async (newVal) => {
  if (newVal && props.equipment?.codigo) {
    isLoadingHistory.value = true
    try {
      deviceHistory.value = await getAssignmentsByGpsId(props.equipment.codigo)
    } catch (e) {
      console.error('Error al cargar historial', e)
    } finally {
      isLoadingHistory.value = false
    }
  } else {
    deviceHistory.value = []
  }
})

// ¿Hay una asignación activa (sin fecha de retiro)?
const currentAssignment = computed(() => {
  return deviceHistory.value.find(a => !a.fechaRetiro)
})

// Pestañas
const activeTab = ref('overview')
const tabs = [
  { id: 'overview', label: 'Especificaciones', icon: 'i-lucide-cpu' },
  { id: 'history', label: 'Historial de Flota', icon: 'i-lucide-history' },
  { id: 'connectivity', label: 'Telemetría', icon: 'i-lucide-signal' }
]

// Handlers
const handleDisconnect = () => {
  if (currentAssignment.value) {
    emit('disconnect', currentAssignment.value) // Envía la asignación entera para hacer el PATCH
  }
}

const handleAssign = () => {
  if (props.equipment) {
    emit('assign', props.equipment) // Envía el equipo entero para abrir el modal
  }
}
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen && equipment" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="isOpen = false" />
      
      <div class="relative w-full max-w-[85%] lg:max-w-[40%] h-full bg-white shadow-2xl flex flex-col">
        
        <div class="bg-slate-950 p-10 text-white shrink-0 relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full" />
          
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h2 class="font-serif text-3xl font-bold tracking-tight">{{ equipment.nombre }}</h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ equipment.id }}</span>
                <span class="text-slate-400 text-xs font-mono uppercase">SN: {{ equipment.codigo }}</span>
                <span class="text-slate-500 text-xs font-mono uppercase">{{ equipment.modelo || 'Sin Modelo' }}</span>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" class="rounded-full text-white hover:bg-white/10" @click="isOpen = false" />
          </div>
        </div>

        <div class="bg-white px-10 border-b border-slate-100 flex gap-8 shrink-0">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative"
            :class="activeTab === tab.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-800'">
            <span class="flex items-center gap-2">
              <UIcon :name="tab.icon" class="w-4 h-4"/> 
              {{ tab.label }}
              <UBadge v-if="tab.id === 'history' && deviceHistory.length" color="primary" variant="subtle" size="xs" class="ml-1 rounded-full px-1.5">{{ deviceHistory.length }}</UBadge>
            </span>
            <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-1 bg-brand-500"></div>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
          
          <div v-if="activeTab === 'overview'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 class="font-serif text-xl font-bold text-slate-900">Ficha del Dispositivo</h3>
            <div class="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
              <div v-for="(val, label) in { 
                'ID Sistema': equipment.id, 
                'Código / IMEI': equipment.codigo, 
                'Modelo': equipment.modelo || 'No especificado',
                'Estado Físico': currentAssignment ? 'Instalado' : 'Disponible (Almacén)', // Calculado dinámicamente
                'Asignación Actual': currentAssignment ? `Unidad ${currentAssignment.placaAuto}` : 'Ninguna'
              }" class="flex justify-between items-center p-5 border-b border-slate-50 last:border-0">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ label }}</span>
                <span class="text-sm font-bold text-slate-800 uppercase" :class="{'text-emerald-600': label === 'Asignación Actual' && currentAssignment}">{{ val }}</span>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'history'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-serif text-xl font-bold text-slate-900">Línea de Tiempo</h3>
              <UBadge v-if="currentAssignment" color="success" variant="soft" class="uppercase text-[9px] font-black tracking-widest px-3 rounded-full">Operando Actualmente</UBadge>
            </div>
            
            <div v-if="isLoadingHistory" class="flex flex-col items-center justify-center py-20">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-brand-500 mb-4" />
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultando registros...</p>
            </div>

            <div v-else-if="deviceHistory.length === 0" class="text-center py-10 opacity-50">
              <UIcon name="i-lucide-history" class="w-10 h-10 mb-2 mx-auto" />
              <p class="text-xs font-black uppercase tracking-widest">Sin registro de instalaciones</p>
            </div>

            <div v-else class="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-10 pb-4">
              <div v-for="hist in deviceHistory" :key="hist.idAsignacion" class="relative">
                 <div class="absolute -left-[41px] top-1 w-4 h-4 rounded-full border-4 border-slate-50" 
                     :class="!hist.fechaRetiro ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'" />
                
                 <div class="flex flex-col bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-brand-500/30">
                  <span class="text-[9px] font-black uppercase tracking-widest" :class="!hist.fechaRetiro ? 'text-emerald-600' : 'text-slate-400'">
                    {{ !hist.fechaRetiro ? 'Instalación Vigente' : 'Histórico' }}
                  </span>
                  <p class="font-sans text-xl font-black text-slate-950 leading-none mt-2 tracking-tight uppercase">
                    Placa: {{ hist.placaAuto }}
                  </p>
                  <div class="flex items-center gap-4 mt-3 text-slate-500">
                    <div class="flex items-center gap-1.5">
                      <UIcon name="i-lucide-calendar-arrow-down" class="w-3.5 h-3.5" />
                      <span class="text-[11px] font-medium">{{ parseLocalDateStr(hist.fechaAsignacion) }}</span>
                    </div>
                    <div class="w-3 h-px bg-slate-300" />
                    <div class="flex items-center gap-1.5">
                      <UIcon name="i-lucide-calendar-arrow-up" class="w-3.5 h-3.5" />
                      <span class="text-[11px] font-medium" :class="{'text-emerald-600 font-bold': !hist.fechaRetiro}">
                        {{ hist.fechaRetiro ? parseLocalDateStr(hist.fechaRetiro) : 'Presente' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'connectivity'" class="flex flex-col items-center justify-center py-20 opacity-40">
            <div class="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-signal-high" class="w-8 h-8" />
            </div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em]">Diagnóstico en tiempo real</p>
            <p class="text-xs text-center mt-2 max-w-[200px]">Módulo disponible en la siguiente actualización de firmware.</p>
          </div>

        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <p class="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Acciones de Hardware</p>
          
          <div class="flex gap-3">
            <UButton 
              v-if="currentAssignment" 
              label="Desvincular Unidad" 
              icon="i-lucide-link-2-off" 
              color="error" 
              variant="soft" 
              class="font-black text-[10px] uppercase tracking-widest rounded-xl px-5" 
              @click="handleDisconnect" 
            />
            
            <UButton 
              v-else
              label="Asignar a Vehículo" 
              icon="i-lucide-link" 
              color="primary" 
              variant="solid" 
              class="font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 px-5" 
              @click="handleAssign"
            />
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>