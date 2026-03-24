<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  user?: {
    id: string
    name: string
    email: string
  } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: { id?: string; name: string; email: string; password?: string }): void
}>()

const form = ref({
  name: '',
  email: '',
  password: ''
})

watch(
  () => props.user,
  (user) => {
    if (!user) {
      form.value = { name: '', email: '', password: '' }
      return
    }

    form.value = {
      name: user.name,
      email: user.email,
      password: ''
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', {
    id: props.user?.id,
    name: form.value.name,
    email: form.value.email,
    password: form.value.password
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
            {{ user ? 'Editar usuario' : 'Crear usuario' }}
          </h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Nombre">
          <UInput v-model="form.name" placeholder="Nombre del usuario" class="w-full" />
        </UFormField>

        <UFormField label="Email">
          <UInput v-model="form.email" type="email" placeholder="correo@empresa.com" class="w-full" />
        </UFormField>

        <UFormField v-if="!user" label="Contraseña">
          <UInput v-model="form.password" type="password" placeholder="Minimo 6 caracteres" class="w-full" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="loading"
            :disabled="!form.name.trim() || !form.email.trim() || (!user && form.password.trim().length < 6)"
            @click="confirm"
          >
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
