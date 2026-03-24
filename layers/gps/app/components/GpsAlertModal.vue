<script setup lang="ts">
import type { GpsAlert } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  alert: GpsAlert | null
  saving?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  descripcion: '',
  limiteValor: 0,
  activo: true
})

watch(
  () => props.alert,
  (alert) => {
    if (!alert) {
      form.value = { descripcion: '', limiteValor: 0, activo: true }
      return
    }

    form.value = {
      descripcion: alert.descripcion,
      limiteValor: alert.limiteValor,
      activo: alert.activo
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', { ...form.value, id: props.alert?.id })
  close()
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" @click="close" />

    <UCard class="relative w-full max-w-md shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">
            {{ alert ? 'Editar alerta' : 'Nueva alerta' }}
          </h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Descripción">
          <UInput v-model="form.descripcion" placeholder="Ej: Límite velocidad" class="w-full" />
        </UFormField>

        <UFormField label="Límite de valor">
          <UInput v-model="form.limiteValor" type="number" class="w-full" />
        </UFormField>

        <UFormField label="Activo">
          <div class="flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              class="h-4 w-4 rounded border-default text-primary focus:ring-primary"
              v-model="form.activo"
            />
            <label for="activo" class="text-sm text-muted">Habilitar alerta</label>
          </div>
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="close">Cancelar</UButton>
          <UButton :loading="saving" color="primary" :disabled="!form.descripcion || form.limiteValor <= 0" @click="confirm">
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
