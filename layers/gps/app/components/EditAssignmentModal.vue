<!-- EditAssignmentModal.vue -->
<script setup lang="ts">

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
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div
      class="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
      @click="close"
    />

    <UCard class="relative w-full max-w-md shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">
            Detalle / Editar Asignación
          </h3>
          <UButton
            variant="ghost"
            icon="i-lucide-x"
            @click="close"
          />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="GPS ID">
          <UInput
            :model-value="assignment?.idGps?.toString()"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField label="Vehículo (Placa)">
          <USelect
            v-model="form.placaAuto"
            :items="fleets"
            value-key="placa"
            label-key="placa"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Fecha de Instalación">
          <UInput
            v-model="form.fechaAsignacion"
            type="date"
            icon="i-lucide-calendar"
            class="w-full"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="soft"
            @click="close"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            :disabled="!form.placaAuto"
            @click="confirm"
          >
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
