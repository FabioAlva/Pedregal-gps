<script setup lang="ts">
import { computed } from 'vue'
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

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
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Modulos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ page ? 'Editar modulo' : 'Crear modulo' }}</h3>
                <p class="text-xs text-slate-300">Configuracion de paginas.</p>
              </div>
            </div>
            <UButton variant="ghost" color="white" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Clave interna">
            <UInput v-model="form.clave" placeholder="Ej: gps-reportes" class="w-full" />
          </UFormField>

          <UFormField label="Nombre visible">
            <UInput v-model="form.nombre" placeholder="Ej: Reportes GPS" class="w-full" />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton color="brand" :loading="loading" :disabled="!form.clave.trim() || !form.nombre.trim()" @click="confirm">
            Guardar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
