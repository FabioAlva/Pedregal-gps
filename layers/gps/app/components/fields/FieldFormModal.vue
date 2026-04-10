<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Field } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  field?: Field | null
  parentOptions: Array<{ label: string, value: number | null }>
  saving?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = {
  nombre: '',
  color: '#3b82f6',
  parentId: null as number | null,
  tipo: 'GUIA' as 'DELIMITADOR' | 'GUIA' | 'INTERES'
}

const tipoOptions = [
  { label: 'Delimitador', value: 'DELIMITADOR' },
  { label: 'Guia', value: 'GUIA' },
  { label: 'Interes', value: 'INTERES' }
]

const form = ref({ ...defaultForm })

watch(() => props.field, (val) => {
  if (val) {
    form.value = {
      nombre: val.nombre ?? '',
      color: val.color ?? '#3b82f6',
      parentId: val.parentId ?? null,
      tipo: (val as Field).tipo ?? 'GUIA'
    }
  } else {
    form.value = { ...defaultForm }
  }
}, { immediate: true })

const confirm = () => {
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
                <UIcon name="i-lucide-shapes" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Campos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">Editar campo</h3>
                <p class="text-xs text-slate-300">Actualiza nombre, color y padre.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="$emit('update:modelValue', false)" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Nombre">
            <UInput v-model="form.nombre" placeholder="Nombre del campo" icon="i-lucide-tag" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Color">
              <UInput v-model="form.color" type="color" class="h-10 w-full cursor-pointer" />
            </UFormField>
            <UFormField label="Padre">
              <USelectMenu
                v-model="form.parentId"
                :items="parentOptions"
                value-key="value"
                label-key="label"
                placeholder="Sin padre"
              />
            </UFormField>
          </div>

          <UFormField label="Tipo">
            <USelectMenu
              v-model="form.tipo"
              :items="tipoOptions"
              value-key="value"
              label-key="label"
            />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="$emit('update:modelValue', false)">Cancelar</UButton>
          <UButton color="brand" :loading="saving" @click="confirm" class="font-bold px-6">
            Actualizar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
