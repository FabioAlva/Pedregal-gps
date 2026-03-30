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
  (newRole) => {
    if (!newRole) {
      form.value = { nombre: '', descripcion: '' }
      return
    }
    form.value = { 
      ...newRole, 
      descripcion: newRole.descripcion ?? '' 
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', {
    id: props.role?.id,
    nombre: form.value.nombre.trim(),
    descripcion: form.value.descripcion.trim()
  })
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="close" />

    <UCard class="relative w-full max-w-md shadow-2xl ring-1 ring-white/10">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield-check" class="text-primary w-5 h-5" />
            <h3 class="font-black text-highlighted uppercase text-sm tracking-widest">
              {{ role ? 'Editar Rol' : 'Nuevo Rol' }}
            </h3>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Nombre del rol" help="Asigna un nombre único">
          <UInput 
            v-model="form.nombre" 
            placeholder="Ej: Administrador" 
            icon="i-lucide-tag"
            class="w-full" 
          />
        </UFormField>

        <UFormField label="Descripción">
          <UTextarea
            v-model="form.descripcion"
            placeholder="¿Qué permisos tiene este rol?"
            class="w-full"
            :rows="4"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">
            Cancelar
          </UButton>
          <UButton 
            color="primary" 
            :loading="loading" 
            :disabled="!form.nombre.trim()" 
            @click="confirm"
            class="px-8 font-bold"
          >
            Guardar Cambios
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>