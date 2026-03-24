<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  page?: {
    id: number
    clave: string
    nombre: string
  } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: { id?: number; clave: string; nombre: string }): void
}>()

const form = ref({
  clave: '',
  nombre: ''
})

watch(
  () => props.page,
  (page) => {
    if (!page) {
      form.value = { clave: '', nombre: '' }
      return
    }

    form.value = {
      clave: page.clave,
      nombre: page.nombre
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', {
    id: props.page?.id,
    clave: form.value.clave,
    nombre: form.value.nombre
  })
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" @click="close" />

    <UCard class="relative w-full max-w-md shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">
            {{ page ? 'Editar modulo' : 'Crear modulo' }}
          </h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Clave interna">
          <UInput v-model="form.clave" placeholder="Ej: gps-reportes" class="w-full" />
        </UFormField>

        <UFormField label="Nombre visible">
          <UInput v-model="form.nombre" placeholder="Ej: Reportes GPS" class="w-full" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="close">Cancelar</UButton>
          <UButton color="primary" :loading="loading" :disabled="!form.clave.trim() || !form.nombre.trim()" @click="confirm">
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
