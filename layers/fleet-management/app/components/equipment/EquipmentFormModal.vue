<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  modelValue: boolean
  equipment?: any | null
  saving?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

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
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full bg-white shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-none bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-cpu" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Hardware</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ equipment ? 'Editar Dispositivo' : 'Nuevo Dispositivo' }}</h3>
                <p class="text-xs text-slate-300">Configura el equipo GPS.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="$emit('update:modelValue', false)" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Nombre Identificador">
            <UInput v-model="form.nombre" placeholder="Ej. GPS-UNIDAD-01" icon="i-lucide-tag" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="IMEI / Codigo">
              <UInput v-model="form.codigo" placeholder="15 digitos" icon="i-lucide-cpu" />
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

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="$emit('update:modelValue', false)">Cancelar</UButton>
          <UButton color="brand" :loading="saving" @click="confirm" class="font-bold px-6">
            {{ equipment ? 'Actualizar' : 'Registrar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>