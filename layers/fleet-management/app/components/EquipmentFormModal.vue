<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  equipment?: any | null
  saving?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const defaultForm = {
  nombre: '',
  codigo: '', // IMEI principal
  modelo: '',
  marca: 'Teltonika',
  estadoId: 1,
  especificaciones: {
    color: '#3b82f6',
    topic: ''
  }
}

const form = ref({ ...defaultForm })

watch(() => props.equipment, (val) => {
  if (val) {
    form.value = { 
      ...val,
      especificaciones: val.especificaciones || { color: '#3b82f6', topic: '' }
    }
  } else {
    form.value = { ...defaultForm }
  }
}, { immediate: true })

const confirm = () => {
  if (!form.value.especificaciones.topic) {
    form.value.especificaciones.topic = `${form.value.codigo}/data`
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <UCard>
      <template #header>
        <h3 class="text-base font-bold text-highlighted uppercase tracking-tight">
          {{ equipment ? 'Editar Dispositivo' : 'Nuevo Dispositivo' }}
        </h3>
      </template>

      <div class="space-y-4">
        <UFormField label="Nombre Identificador">
          <UInput v-model="form.nombre" placeholder="Ej. GPS-UNIDAD-01" icon="i-lucide-tag" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="IMEI / Código">
            <UInput v-model="form.codigo" placeholder="15 dígitos" icon="i-lucide-cpu" />
          </UFormField>
          <UFormField label="Color en Mapa">
            <UInput v-model="form.especificaciones.color" type="color" class="h-10 w-full cursor-pointer" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Marca">
            <UInput v-model="form.marca" />
          </UFormField>
          <UFormField label="Modelo">
            <UInput v-model="form.modelo" />
          </UFormField>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="$emit('update:modelValue', false)">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="confirm" class="font-bold px-6">
            {{ equipment ? 'Actualizar' : 'Registrar' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>