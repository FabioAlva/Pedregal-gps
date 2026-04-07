<script setup lang="ts">
import { computed } from 'vue'
import type { Fleet } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  fleet?: Fleet | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = { 
  marca: '', 
  modelo: '', 
  placa: '', 
  anho: new Date().getFullYear(),
  estado: 'OPERATIVO',
  vencimientoSoat: '', 
  vencimientoTecnica: '' 
}

const form = ref({ ...defaultForm })

watch(
  () => props.fleet,
  (fleet) => {
    if (fleet) {
      form.value = { 
        marca: fleet.marca ?? '', 
        modelo: fleet.modelo ?? '', 
        placa: fleet.placa ?? '', 
        anho: fleet.anho ?? new Date().getFullYear(),
        estado: fleet.estado ?? 'OPERATIVO',
        // Arreglo: Usamos una variable intermedia o aseguramos el string final
        vencimientoSoat: fleet.vencimientoSoat 
          ? new Date(fleet.vencimientoSoat).toISOString().split('T')[0] ?? '' 
          : '',
        vencimientoTecnica: fleet.vencimientoTecnica 
          ? new Date(fleet.vencimientoTecnica).toISOString().split('T')[0] ?? '' 
          : ''
      }
    } else {
      form.value = { ...defaultForm }
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  const payload: any = { ...form.value }
  
  if (props.fleet?.id) {
    payload.id = props.fleet.id
  } else {
    delete payload.id 
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full bg-white shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-none bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon :name="fleet ? 'i-lucide-truck' : 'i-lucide-plus-circle'" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Flota</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ fleet ? 'Editar Flota' : 'Nueva Flota' }}</h3>
                <p class="text-xs text-slate-300">Completa la ficha de la unidad.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Marca">
            <UInput v-model="form.marca" placeholder="Ej. Toyota" icon="i-lucide-factory" class="w-full" />
          </UFormField>

          <UFormField label="Modelo">
            <UInput v-model="form.modelo" placeholder="Ej. Hilux" icon="i-lucide-car" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Placa">
              <UInput v-model="form.placa" placeholder="ABC-123" icon="i-lucide-id-card" class="uppercase" />
            </UFormField>
            <UFormField label="Año">
              <UInput v-model="form.anho" type="number" icon="i-lucide-calendar" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Vencimiento SOAT">
              <UInput v-model="form.vencimientoSoat" type="date" icon="i-lucide-calendar" />
            </UFormField>
            <UFormField label="Revision Tecnica">
              <UInput v-model="form.vencimientoTecnica" type="date" icon="i-lucide-calendar-check" />
            </UFormField>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton color="brand" :loading="loading" :disabled="!form.marca || !form.placa" @click="confirm" class="font-bold px-6">
            {{ fleet ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>