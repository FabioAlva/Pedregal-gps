<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  user?: { id: string; name: string; email: string } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

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
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon :name="user ? 'i-lucide-user-cog' : 'i-lucide-user-plus'" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Usuarios</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ user ? 'Editar Perfil' : 'Nueva Cuenta' }}</h3>
                <p class="text-xs text-slate-300">Gestion de credenciales.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Nombre Completo" help="Ingresa el nombre y apellido">
            <UInput 
              v-model="form.name" 
              placeholder="Ej. Fabio Alva" 
              icon="i-lucide-user"
              class="w-full" 
            />
          </UFormField>

          <UFormField label="Correo Electronico" help="Se usara para el inicio de sesion">
            <UInput 
              v-model="form.email" 
              type="email" 
              placeholder="correo@tgi.com" 
              icon="i-lucide-mail"
              class="w-full" 
            />
          </UFormField>

          <UFormField 
            :label="user ? 'Cambiar Contrasena' : 'Contrasena'" 
            :help="user ? 'Dejar en blanco para mantener actual' : 'Minimo 6 caracteres'"
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

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="brand"
            :loading="loading"
            :disabled="!form.name.trim() || !form.email.trim() || (!user && form.password.trim().length < 6)"
            @click="confirm"
            class="font-bold px-6"
          >
            {{ user ? 'Actualizar' : 'Crear Usuario' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>