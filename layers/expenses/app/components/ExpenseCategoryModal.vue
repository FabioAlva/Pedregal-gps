<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExpenseCategory } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  categories: ExpenseCategory[]
  saving?: boolean
  updating?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'create', payload: { nombre: string; esCombustible: boolean; activo: boolean }): void
  (event: 'update', id: number, payload: { nombre: string; esCombustible: boolean; activo: boolean }): void
  (event: 'delete', id: number): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = {
  nombre: '',
  esCombustible: false,
  activo: true
}

const form = ref({ ...defaultForm })
const editingId = ref<number | null>(null)

const resetForm = () => {
  form.value = { ...defaultForm }
  editingId.value = null
}

watch(isOpen, (open) => {
  if (!open) resetForm()
})

const startEdit = (category: ExpenseCategory) => {
  editingId.value = category.id
  form.value = {
    nombre: category.nombre ?? '',
    esCombustible: category.esCombustible ?? false,
    activo: category.activo ?? true
  }
}

const confirm = () => {
  if (!form.value.nombre.trim()) return
  const payload = {
    nombre: form.value.nombre.trim(),
    esCombustible: form.value.esCombustible,
    activo: form.value.activo
  }

  if (editingId.value) {
    emit('update', editingId.value, payload)
  } else {
    emit('create', payload)
  }

  resetForm()
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[720px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-tags" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Catalogo</span>
                <h3 class="text-xl font-black tracking-tight mt-1">Categorias de gasto</h3>
                <p class="text-xs text-slate-300">Gestiona las clasificaciones de costos.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="isOpen = false" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nombre">
              <UInput v-model="form.nombre" placeholder="Ej. Combustible" icon="i-lucide-tag" />
            </UFormField>
            <UFormField label="Estado">
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

          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" @click="resetForm">Limpiar</UButton>
            <UButton color="brand" class="font-bold" :loading="saving || updating" @click="confirm">
              {{ editingId ? 'Actualizar' : 'Agregar' }}
            </UButton>
          </div>

          <div class="bg-slate-50/60 rounded-2xl border border-slate-200 overflow-hidden">
            <div class="grid grid-cols-3 gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Categoria</span>
              <span>Estado</span>
              <span class="text-right">Acciones</span>
            </div>

            <div v-for="category in categories" :key="category.id" class="grid grid-cols-3 gap-3 px-4 py-4 border-t border-slate-200/60 items-center">
              <div class="font-semibold text-slate-800">{{ category.nombre }}</div>
              <div class="text-xs font-bold" :class="category.activo ? 'text-emerald-600' : 'text-slate-400'">
                {{ category.activo ? 'Activo' : 'Inactivo' }}
              </div>
              <div class="flex items-center justify-end gap-2">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="startEdit(category)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash" @click="emit('delete', category.id)" />
              </div>
            </div>

            <div v-if="!categories.length" class="py-10 text-center text-xs font-semibold text-slate-400">
              No hay categorias registradas.
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <UButton variant="ghost" color="neutral" @click="isOpen = false">Cerrar</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
