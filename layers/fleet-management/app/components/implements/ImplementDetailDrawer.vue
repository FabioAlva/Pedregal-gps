<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Fleet, Implement } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  implement: Implement | null
  fleets: Fleet[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('overview')
const tabs = [
  { id: 'overview', label: 'Especificaciones', icon: 'i-lucide-tool' },
  { id: 'history', label: 'Historial', icon: 'i-lucide-history' }
]

watch(
  () => props.modelValue,
  (open) => {
    if (open) activeTab.value = 'overview'
  }
)

const assignedFleet = computed(() => {
  if (!props.implement?.flotaId) return null
  return props.fleets.find(f => f.id === props.implement?.flotaId) || null
})

const historyItems = computed(() => {
  if (!props.implement) return []
  if (!props.implement.flotaId) return []
  return [
    {
      id: props.implement.id,
      placa: assignedFleet.value?.placa || 'Sin placa',
      fecha: props.implement.updatedAt || props.implement.createdAt
    }
  ]
})

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-PE')
}
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen && implement" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="isOpen = false" />

      <div class="relative w-full max-w-[85%] lg:max-w-[40%] h-full bg-white shadow-2xl flex flex-col">
        <div class="bg-slate-950 p-12 text-white shrink-0 relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-brand-500/10 blur-[120px] rounded-full" />

          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h2 class="font-sans text-5xl font-black leading-none tracking-tighter uppercase">
                {{ implement.nombre }}
              </h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ implement.id }}</span>
                <span class="text-slate-400 text-xs font-mono uppercase tracking-tight">{{ implement.tipo }}</span>
                <span v-if="implement.serie" class="text-slate-500 text-xs font-mono uppercase">Serie {{ implement.serie }}</span>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="white" variant="ghost" size="xl" @click="isOpen = false" />
          </div>
        </div>

        <div class="bg-white px-12 border-b border-slate-100 flex gap-10 shrink-0">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative"
            :class="activeTab === tab.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-800'">
            <span class="flex items-center gap-2">
              <UIcon :name="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </span>
            <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-1 bg-brand-500 animate-in fade-in zoom-in duration-300" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-12 bg-slate-50/50 custom-scrollbar">
          <div v-if="activeTab === 'overview'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 class="font-serif text-2xl font-bold text-slate-900">Especificaciones</h3>
            <div class="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
              <div v-for="(val, label) in {
                'Tipo': implement.tipo,
                'Serie': implement.serie || 'Sin serie',
                'Estado': implement.estado,
                'Unidad asignada': assignedFleet?.placa || 'Sin asignar',
                'Activo': implement.activo ? 'Activo' : 'Inactivo'
              }" class="flex justify-between items-center p-5 border-b border-slate-50 last:border-0">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ label }}</span>
                <span class="text-sm font-bold text-slate-800 uppercase">{{ val }}</span>
              </div>
            </div>

            <div class="space-y-2">
              <h3 class="font-serif text-2xl font-bold text-slate-900">Descripcion</h3>
              <div class="bg-white rounded-2xl border border-slate-200/60 p-5 text-sm text-slate-600">
                {{ implement.descripcion || 'Sin descripcion' }}
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'history'" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="flex justify-between items-center">
              <h3 class="font-serif text-xl font-bold text-slate-900">Historial de asignaciones</h3>
            </div>

            <div v-if="!historyItems.length" class="text-center py-10 opacity-50">
              <UIcon name="i-lucide-history" class="w-10 h-10 mb-2 mx-auto" />
              <p class="text-xs font-black uppercase tracking-widest">Sin historial registrado</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="item in historyItems" :key="item.id" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Unidad</p>
                    <p class="text-lg font-black text-slate-900 uppercase">{{ item.placa }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Ultima actualizacion</p>
                    <p class="text-sm font-bold text-slate-700">{{ formatDate(item.fecha) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>
