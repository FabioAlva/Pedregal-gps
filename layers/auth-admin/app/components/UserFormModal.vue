<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  user?: { id: string; name: string; email: string } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const form = ref({
  name: '',
  email: '',
  password: ''
})

// REGLA DE ORO: Clonar siempre para evitar mutar el Store por referencia
watch(
  () => props.user,
  (user) => {
    if (user) {
      form.value = { 
        name: user.name, 
        email: user.email, 
        password: '' // Siempre vacío al abrir para editar
      }
    } else {
      form.value = { name: '', email: '', password: '' }
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  const payload: any = {
    name: form.value.name,
    email: form.value.email,
  }
  
  if (props.user?.id) payload.id = props.user.id
  if (form.value.password) payload.password = form.value.password

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
              <UIcon :name="user ? 'i-lucide-user-cog' : 'i-lucide-user-plus'" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-highlighted leading-none">
                {{ user ? 'Editar Perfil' : 'Nueva Cuenta' }}
              </h3>
              <p class="text-[10px] text-muted font-medium uppercase tracking-wider mt-1">
                {{ user ? 'Actualizar credenciales' : 'Registrar nuevo usuario' }}
              </p>
            </div>
          </div>
          <UButton color="primary" variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Nombre Completo" help="Ingresa el nombre y apellido">
          <UInput 
            v-model="form.name" 
            placeholder="Ej. Fabio Alva" 
            icon="i-lucide-user"
            class="w-full" 
          />
        </UFormField>

        <UFormField label="Correo Electrónico" help="Se usará para el inicio de sesión">
          <UInput 
            v-model="form.email" 
            type="email" 
            placeholder="correo@tgi.com" 
            icon="i-lucide-mail"
            class="w-full" 
          />
        </UFormField>

        <UFormField 
          :label="user ? 'Cambiar Contraseña' : 'Contraseña'" 
          :help="user ? 'Dejar en blanco para mantener actual' : 'Mínimo 6 caracteres'"
        >
          <UInput 
            v-model="form.password" 
            type="password" 
            placeholder="••••••••" 
            icon="i-lucide-lock"
            class="w-full" 
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
            :disabled="!form.name.trim() || !form.email.trim() || (!user && form.password.trim().length < 6)"
            @click="confirm"
            class="font-bold px-6"
          >
            {{ user ? 'Actualizar' : 'Crear Usuario' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>