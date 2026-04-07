<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Fleet, Implement } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  implement?: Implement | null
  fleets: Fleet[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = {
  nombre: '',
  tipo: '',
  serie: '',
  estado: 'OPERATIVO',
  flotaId: '',
  descripcion: '',
  activo: true
}

const form = ref({ ...defaultForm })

watch(
  () => props.implement,
  (impl) => {
    if (impl) {
      form.value = {
        nombre: impl.nombre ?? '',
        tipo: impl.tipo ?? '',
        serie: impl.serie ?? '',
        estado: impl.estado ?? 'OPERATIVO',
        flotaId: impl.flotaId ? String(impl.flotaId) : '',
        descripcion: impl.descripcion ?? '',
        activo: impl.activo ?? true
      }
    } else {
      form.value = { ...defaultForm }
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  const payload: any = {
    nombre: form.value.nombre.trim(),
    tipo: form.value.tipo.trim(),
    serie: form.value.serie?.trim() || null,
    estado: form.value.estado,
    flotaId: form.value.flotaId ? Number(form.value.flotaId) : null,
    descripcion: form.value.descripcion?.trim() || null,
    activo: form.value.activo
  }

  if (props.implement?.id) {
    payload.id = props.implement.id
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[620px] bg-white shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-none bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-tractor" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Implementos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ implement ? 'Editar implemento' : 'Nuevo implemento' }}</h3>
                <p class="text-xs text-slate-300">Gestiona equipos acoplables.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nombre">
              <UInput v-model="form.nombre" placeholder="Ej. Arado" icon="i-lucide-wrench" />
            </UFormField>
            <UFormField label="Tipo">
              <UInput v-model="form.tipo" placeholder="Ej. Rastrillo" icon="i-lucide-tag" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Serie">
              <UInput v-model="form.serie" placeholder="Serie o codigo" icon="i-lucide-barcode" />
            </UFormField>
            <UFormField label="Estado">
              <USelect
                v-model="form.estado"
                :items="[
                  { label: 'Operativo', value: 'OPERATIVO' },
                  { label: 'En reparacion', value: 'EN_REPARACION' },
                  { label: 'Inactivo', value: 'INACTIVO' }
                ]"
                placeholder="Seleccionar estado"
              />
            </UFormField>
          </div>

          <UFormField label="Unidad asignada">
            <USelect
              v-model="form.flotaId"
              :items="fleets"
              value-key="id"
              label-key="placa"
              placeholder="Sin asignar"
              icon="i-lucide-truck"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Notas o detalles" icon="i-lucide-notebook-pen" />
          </UFormField>

          <UFormField label="Estado de uso">
            <USelect
              v-model="form.activo"
              :items="[
                { label: 'Activo', value: true },
                { label: 'Inactivo', value: false }
              ]"
              placeholder="Seleccionar"
            />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="brand"
            :loading="saving"
            :disabled="!form.nombre || !form.tipo"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ implement ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
