<!-- EditAssignmentModal.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  assignment: {
    idAsignacion: number 
    idGps: string 
    placaAuto: string
    fechaAsignacion: string
    fechaRetiro: string | null
  } | null
  fleets: { id: number, placa: string }[]
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  placaAuto: '',
  fechaAsignacion: ''
})

watch(() => props.assignment, (val) => {
  if (!val) return
  form.value = {
    placaAuto: val.placaAuto,
    fechaAsignacion: val.fechaAsignacion?.split('T')[0]?.split(' ')[0] ?? ''
  }
}, { immediate: true })

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', { idAsignacion: props.assignment?.idAsignacion, ...form.value })
  close()
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-none bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-edit" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Asignacion</span>
                <h3 class="text-xl font-black tracking-tight mt-1">Detalle / Editar</h3>
                <p class="text-xs text-slate-300">Actualiza la asignacion.</p>
              </div>
            </div>
            <UButton variant="ghost" color="white" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="GPS ID">
            <UInput
              :model-value="assignment?.idGps?.toString()"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField label="Vehiculo (Placa)">
            <USelect
              v-model="form.placaAuto"
              :items="fleets"
              value-key="placa"
              label-key="placa"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Fecha de Instalacion">
            <UInput
              v-model="form.fechaAsignacion"
              type="date"
              icon="i-lucide-calendar"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton color="brand" :disabled="!form.placaAuto" @click="confirm">Guardar</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
