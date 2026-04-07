<script setup lang="ts">
import { computed, ref, watch, resolveComponent } from 'vue'

const props = defineProps<{
  modelValue: boolean
  fleets: { id: number, placa: string }[]
  // Recibimos el objeto GPS completo directamente
  gps: { id: number, nombre: string, codigo: string } | null 
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  flotaId: undefined as number | undefined,
  equipoId: undefined as number | undefined,
  instaladoEl: new Date().toISOString().split('T')[0]
})

// Sincronizamos el ID del equipo al abrir el modal
watch(() => props.gps, (newGps) => {
  if (newGps) form.value.equipoId = newGps.id
}, { immediate: true })

const close = () => {
  isOpen.value = false
  form.value.flotaId = undefined // Solo limpiamos la flota, el GPS se reasigna por el watch
}

const confirm = () => {
  emit('save', { ...form.value })
  close()
}

// Resolución de componentes si no usas auto-imports completos
const UIcon = resolveComponent('UIcon')
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-none bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-link" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Asignacion</span>
                <h3 class="text-xl font-black tracking-tight mt-1">Vincular Unidad</h3>
                <p class="text-xs text-slate-300">Asignacion de hardware a flota.</p>
              </div>
            </div>
            <UButton variant="ghost" color="white" icon="i-lucide-x" class="rounded-none" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-6">
          <UFormField label="Hardware a Instalar">
            <div class="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-none w-full select-none">
              <div class="w-10 h-10 rounded-none bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                <UIcon name="i-lucide-cpu" class="w-5 h-5 text-brand-500" />
              </div>
              <div class="min-w-0">
                <p class="font-sans text-sm font-black text-slate-900 leading-none truncate">{{ gps?.nombre || 'Desconocido' }}</p>
                <p class="font-mono text-[10px] font-bold text-slate-500 mt-1 truncate">SN: {{ gps?.codigo || '-' }}</p>
              </div>
              <div class="ml-auto pr-2">
                <UIcon name="i-lucide-lock" class="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </UFormField>

          <UFormField label="Vehiculo Destino (Placa)">
            <USelect
              v-model="form.flotaId"
              :items="fleets"
              value-key="id"
              label-key="placa"
              placeholder="Seleccionar unidad..."
              class="w-full font-bold"
              size="lg"
              icon="i-lucide-truck"
            />
          </UFormField>

          <UFormField label="Fecha de Instalacion">
            <UInput
              v-model="form.instaladoEl"
              type="date"
              icon="i-lucide-calendar"
              class="w-full font-medium"
              size="lg"
            />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" class="font-bold px-5" @click="close">
            Cancelar
          </UButton>
          <UButton color="brand" :disabled="!form.flotaId || !form.equipoId" class="font-bold px-6" @click="confirm">
            Confirmar Asignacion
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>