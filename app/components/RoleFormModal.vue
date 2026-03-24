<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  role?: {
    id: number
    nombre: string
    descripcion: string | null
  } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: { id?: number; nombre: string; descripcion: string }): void
}>()

const form = ref({
  nombre: '',
  descripcion: ''
})

watch(
  () => props.role,
  (role) => {
    if (!role) {
      form.value = { nombre: '', descripcion: '' }
      return
    }

    form.value = {
      nombre: role.nombre,
      descripcion: role.descripcion ?? ''
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', {
    id: props.role?.id,
    nombre: form.value.nombre,
    descripcion: form.value.descripcion
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
            {{ role ? 'Editar rol' : 'Crear rol' }}
          </h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Nombre del rol">
          <UInput v-model="form.nombre" placeholder="Ej: Supervisor" class="w-full" />
        </UFormField>

        <UFormField label="Descripcion">
          <textarea
            v-model="form.descripcion"
            class="w-full min-h-24 rounded-md border border-default bg-default p-2.5 text-sm"
            placeholder="Describe este rol"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="close">Cancelar</UButton>
          <UButton color="primary" :loading="loading" :disabled="!form.nombre.trim()" @click="confirm">
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
