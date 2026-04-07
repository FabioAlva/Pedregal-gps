<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { InspectionTemplate } from '#shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  template?: InspectionTemplate | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const emptyField = () => ({
  id: '',
  label: '',
  tipo: 'boolean',
  requerido: true,
  alertaSi: true,
  opciones: ''
})

const form = ref({
  nombre: '',
  descripcion: '',
  activo: true,
  fields: [emptyField()]
})

const toFieldId = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

watch(
  () => props.template,
  (template) => {
    if (template) {
      form.value = {
        nombre: template.nombre ?? '',
        descripcion: template.descripcion ?? '',
        activo: template.activo ?? true,
        fields: (template.esquema ?? []).map((field) => ({
          id: field.id,
          label: field.label,
          tipo: field.tipo,
          requerido: field.requerido,
          alertaSi: field.alertaSi ?? false,
          opciones: Array.isArray(field.opciones) ? field.opciones.join(', ') : ''
        }))
      }

      if (form.value.fields.length === 0) {
        form.value.fields = [emptyField()]
      }
    } else {
      form.value = {
        nombre: '',
        descripcion: '',
        activo: true,
        fields: [emptyField()]
      }
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const addField = () => {
  form.value.fields.push(emptyField())
}

const removeField = (index: number) => {
  if (form.value.fields.length === 1) return
  form.value.fields.splice(index, 1)
}

const confirm = () => {
  const esquema = form.value.fields
    .map((field) => {
      const id = field.id?.trim() || toFieldId(field.label)
      const opciones = field.tipo === 'seleccion'
        ? (field.opciones || '').split(',').map(o => o.trim()).filter(Boolean)
        : undefined

      return {
        id,
        label: field.label.trim(),
        tipo: field.tipo,
        requerido: !!field.requerido,
        alertaSi: !!field.alertaSi,
        opciones
      }
    })
    .filter(field => field.id && field.label)

  emit('save', {
    nombre: form.value.nombre.trim(),
    descripcion: form.value.descripcion?.trim() || null,
    activo: form.value.activo,
    esquema
  })
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[760px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-clipboard-list" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Inspecciones</span>
                <h3 class="text-xl font-black tracking-tight mt-1">
                  {{ template ? 'Editar plantilla' : 'Nueva plantilla' }}
                </h3>
                <p class="text-xs text-slate-300">Define los puntos de chequeo del DVIR.</p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="text-white" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Nombre">
              <UInput v-model="form.nombre" placeholder="Checklist diario" icon="i-lucide-pen-line" />
            </UFormField>
            <UFormField label="Descripcion">
              <UInput v-model="form.descripcion" placeholder="Resumen corto" icon="i-lucide-notebook" />
            </UFormField>
            <UFormField label="Estado">
              <USelect
                v-model="form.activo"
                :items="[{ label: 'Activa', value: true }, { label: 'Inactiva', value: false }]"
                placeholder="Estado"
              />
            </UFormField>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Campos</h4>
              <p class="text-xs text-slate-500">Agrega los puntos de revision que debe llenar el operador.</p>
            </div>
            <UButton color="primary" variant="subtle" icon="i-lucide-plus" class="px-4" @click="addField">
              Agregar campo
            </UButton>
          </div>

          <div class="space-y-4">
            <div
              v-for="(field, index) in form.fields"
              :key="index"
              class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Campo {{ index + 1 }}
                </span>
                <UButton
                  icon="i-lucide-trash"
                  variant="ghost"
                  color="error"
                  class="px-2"
                  @click="removeField(index)"
                />
              </div>
              <div class="grid grid-cols-4 gap-3">
                <UFormField label="Etiqueta">
                  <UInput v-model="field.label" placeholder="Frenos" />
                </UFormField>
                <UFormField label="Tipo">
                  <USelect
                    v-model="field.tipo"
                    :items="[
                      { label: 'Si/No', value: 'boolean' },
                      { label: 'Texto', value: 'texto' },
                      { label: 'Numero', value: 'numero' },
                      { label: 'Seleccion', value: 'seleccion' },
                      { label: 'Foto URL', value: 'foto' }
                    ]"
                  />
                </UFormField>
                <UFormField label="Requerido">
                  <USelect
                    v-model="field.requerido"
                    :items="[{ label: 'Si', value: true }, { label: 'No', value: false }]"
                  />
                </UFormField>
                <UFormField label="Genera alerta">
                  <USelect
                    v-model="field.alertaSi"
                    :items="[{ label: 'Si', value: true }, { label: 'No', value: false }]"
                  />
                </UFormField>
              </div>
              <div v-if="field.tipo === 'seleccion'" class="mt-3">
                <UFormField label="Opciones (separadas por coma)">
                  <UInput v-model="field.opciones" placeholder="Ok, Reparar, Revisar" />
                </UFormField>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.nombre.trim() || form.fields.length === 0"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ template ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
