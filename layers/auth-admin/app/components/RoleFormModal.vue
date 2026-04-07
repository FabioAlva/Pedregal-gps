<script setup lang="ts">
import { computed } from 'vue'
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

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
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Roles</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ role ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
                <p class="text-xs text-slate-300">Permisos y acceso.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Nombre del rol" help="Asigna un nombre unico">
            <UInput 
              v-model="form.nombre" 
              placeholder="Ej: Administrador" 
              icon="i-lucide-tag"
              class="w-full" 
            />
          </UFormField>

          <UFormField label="Descripcion">
            <UTextarea
              v-model="form.descripcion"
              placeholder="¿Que permisos tiene este rol?"
              class="w-full"
              :rows="4"
            />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton 
            color="brand" 
            :loading="loading" 
            :disabled="!form.nombre.trim()" 
            @click="confirm"
            class="px-8 font-bold"
          >
            Guardar Cambios
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>