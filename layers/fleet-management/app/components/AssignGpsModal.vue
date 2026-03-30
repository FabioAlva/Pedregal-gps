<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  fleets: { id: number, placa: string }[]
  gpsList: { id: number, name: string }[]
  initialGpsId?: number
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  flotaId: undefined as number | undefined,
  equipoId: undefined as number | undefined,
  instaladoEl: new Date().toISOString().split('T')[0]
})

watch(() => props.initialGpsId, (newId) => {
  if (newId) form.value.equipoId = newId
}, { immediate: true })

const close = () => {
  emit('update:modelValue', false)
  form.value = { flotaId: undefined, equipoId: undefined, instaladoEl: new Date().toISOString().split('T')[0] }
}

const confirm = () => {
  emit('save', { ...form.value })
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
            Asignar GPS
          </h3>
          <UButton
            variant="ghost"
            icon="i-lucide-x"
            @click="close"
          />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Vehículo (Placa)">
          <USelect
            v-model="form.flotaId"
            :items="fleets"
            value-key="id"
            label-key="placa"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Dispositivo GPS">
          <USelect
            v-model="form.equipoId"
            :items="gpsList"
            value-key="id"
            label-key="name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Fecha de Instalación">
          <UInput
            v-model="form.instaladoEl"
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
            :disabled="!form.flotaId || !form.equipoId"
            @click="confirm"
          >
            Confirmar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
