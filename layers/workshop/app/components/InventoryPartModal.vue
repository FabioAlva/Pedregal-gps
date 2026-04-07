<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { InventoryPart } from '#shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  part?: InventoryPart | null
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
  sku: '',
  unidad: 'UND',
  stockActual: '0',
  stockMinimo: '0',
  ubicacion: '',
  descripcion: '',
  activo: true
}

const form = ref({ ...defaultForm })

watch(
  () => props.part,
  (part) => {
    if (part) {
      form.value = {
        nombre: part.nombre ?? '',
        sku: part.sku ?? '',
        unidad: part.unidad ?? 'UND',
        stockActual: part.stockActual != null ? String(part.stockActual) : '0',
        stockMinimo: part.stockMinimo != null ? String(part.stockMinimo) : '0',
        ubicacion: part.ubicacion ?? '',
        descripcion: part.descripcion ?? '',
        activo: part.activo ?? true
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
    sku: form.value.sku?.trim() || null,
    unidad: form.value.unidad?.trim() || null,
    stockActual: form.value.stockActual ? Number(form.value.stockActual) : 0,
    stockMinimo: form.value.stockMinimo ? Number(form.value.stockMinimo) : 0,
    ubicacion: form.value.ubicacion?.trim() || null,
    descripcion: form.value.descripcion?.trim() || null,
    activo: form.value.activo
  }

  if (props.part?.id) {
    payload.id = props.part.id
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[680px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-package" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">Repuestos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">
                  {{ part ? 'Editar repuesto' : 'Nuevo repuesto' }}
                </h3>
                <p class="text-xs text-slate-300">Gestiona stock y ubicacion.</p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="text-white" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nombre">
              <UInput v-model="form.nombre" placeholder="Filtro de aceite" icon="i-lucide-tag" />
            </UFormField>
            <UFormField label="SKU">
              <UInput v-model="form.sku" placeholder="SKU-001" />
            </UFormField>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Unidad">
              <UInput v-model="form.unidad" placeholder="UND" />
            </UFormField>
            <UFormField label="Stock actual">
              <UInput v-model="form.stockActual" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Stock minimo">
              <UInput v-model="form.stockMinimo" type="number" placeholder="0" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ubicacion">
              <UInput v-model="form.ubicacion" placeholder="Almacen A" />
            </UFormField>
            <UFormField label="Estado">
              <USelect
                v-model="form.activo"
                :items="[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]"
              />
            </UFormField>
          </div>

          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Notas o especificaciones" />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.nombre.trim()"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ part ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
