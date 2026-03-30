<script setup lang="ts">
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
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" @click="close" />

    <UCard class="relative w-full max-w-md shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg text-primary">
              <UIcon :name="fleet ? 'i-lucide-truck' : 'i-lucide-plus-circle'" class="w-5 h-5" />
            </div>
            <h3 class="text-base font-black text-highlighted uppercase tracking-tight">
              {{ fleet ? 'Editar Flota' : 'Nueva Flota' }}
            </h3>
          </div>
          <UButton color="primary" variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
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
          <UFormField label="Revisión Técnica">
            <UInput v-model="form.vencimientoTecnica" type="date" icon="i-lucide-calendar-check" />
          </UFormField>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton color="primary" :loading="loading" :disabled="!form.marca || !form.placa" @click="confirm" class="font-bold px-6">
            {{ fleet ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>