<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useFields } from '#layers/gps/app/composables/useFields'
import type { Field } from '~~/shared/types/db'
import { formatLocalDate } from '#layers/gps/app/utils/FormatTime'
import FieldFormModal from '#layers/gps/app/components/fields/FieldFormModal.vue'

const UButton = resolveComponent('UButton')

const { fields, fetchFields, updateField } = useFields()
const showModal = ref(false)
const selectedField = ref<Field | null>(null)
const isUpdating = ref(false)

const parentNameById = computed(() => {
  const map = new Map<number, string>()
  for (const field of fields.value) {
    map.set(field.id, field.nombre)
  }
  return map
})

const rows = computed(() => {
  return [...fields.value].sort((a, b) => {
    const parentA = a.parentId ? parentNameById.value.get(a.parentId) ?? '' : ''
    const parentB = b.parentId ? parentNameById.value.get(b.parentId) ?? '' : ''
    if (parentA !== parentB) return parentA.localeCompare(parentB)
    return a.nombre.localeCompare(b.nombre)
  })
})

const formatDateValue = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  return formatLocalDate(date.getTime())
}

const resolveParentName = (field: Field) => {
  if (!field.parentId) return 'Sin padre'
  return parentNameById.value.get(field.parentId) ?? 'Sin padre'
}

const parentOptions = computed(() => {
  const options = [{ label: 'Sin padre', value: null as number | null }]
  const excludedId = selectedField.value?.id
  for (const field of fields.value) {
    if (field.id === excludedId) continue
    options.push({ label: field.nombre, value: field.id })
  }
  return options
})

const openModal = (field: Field) => {
  selectedField.value = field
  showModal.value = true
}

const handleSave = async (payload: { nombre: string; color?: string | null; parentId?: number | null; tipo?: Field['tipo'] | null }) => {
  if (!selectedField.value) return
  isUpdating.value = true
  const ok = await updateField(selectedField.value.id, {
    nombre: payload.nombre,
    color: payload.color ?? null,
    parentId: payload.parentId ?? null,
    tipo: payload.tipo ?? selectedField.value.tipo ?? 'GUIA'
  })
  isUpdating.value = false
  if (ok) showModal.value = false
}

const columns: TableColumn<Field>[] = [
  {
    accessorKey: 'color',
    header: 'Color',
    cell: ({ row }) => h('span', {
      class: 'inline-flex w-3 h-3 rounded-full border border-slate-300',
      style: { backgroundColor: row.original.color || '#3b82f6' }
    })
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }) => h('span', { class: 'font-semibold text-slate-950' }, row.original.nombre)
  },
  { accessorKey: 'tipo', header: 'Tipo' },
  { accessorKey: 'categoria', header: 'Categoria' },
  {
    accessorKey: 'parentId',
    header: 'Padre',
    cell: ({ row }) => resolveParentName(row.original)
  },
  {
    accessorKey: 'activo',
    header: 'Activo',
    cell: ({ row }) => h('span', {
      class: [
        'text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded',
        row.original.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      ].join(' ')
    }, row.original.activo ? 'Activo' : 'Inactivo')
  },
  {
    accessorKey: 'updatedAt',
    header: 'Actualizado',
    cell: ({ row }) => formatDateValue(row.original.updatedAt ?? row.original.createdAt)
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h(UButton, {
      icon: 'i-lucide-pencil',
      variant: 'ghost',
      color: 'neutral',
      onClick: (e: Event) => { e.stopPropagation(); openModal(row.original) }
    })
  }
]

onMounted(async () => {
  await fetchFields()
})
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 w-full font-sans text-slate-900 overflow-hidden relative ">
    
   <header class="flex flex-col w-full mb-6 shrink-0">
      
      <div class="flex items-center justify-between pb-3 pl-1 pr-1">
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <span>Flota Agrícola</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-40" />
          <span class="text-slate-900">Listado de Campos</span>
        </nav>
      </div>

      <div class="w-full flex items-center bg-white border border-slate-300 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 rounded-none transition-colors">
        <UInput 
          v-model="search" 
          variant="none" 
          placeholder="Buscar campo..." 
          icon="i-lucide-search" 
          class="flex-1 font-medium"
          :ui="{ wrapper: 'flex-1', base: 'w-full h-11 rounded-none text-sm bg-transparent' }"
        />
        <div class="w-px h-6 bg-slate-300 mx-2" />
        <UButton 
          color="brand" 
          icon="i-lucide-plus" 
          class="px-8 h-11 text-xs font-bold text-white bg-primary rounded-none" 
          label="Nuevo Campo" 
          @click="selectedField = null; showModal = true" 
        />
      </div>

    </header>

    <div class="bg-white border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col rounded-none min-h-0">


      <div v-if="!rows.length" class="py-16 text-center text-sm text-slate-400 flex-1 flex items-center justify-center">
        No hay campos registrados.
      </div>

      <div v-else class="overflow-auto flex-1">
        <UTable
          :data="rows"
          :columns="columns"
          sticky
          class="flex-1"
          :ui="{
            thead: 'bg-slate-50/80 sticky top-0 z-10',
            th: 'text-[10px] font-bold text-slate-500 uppercase tracking-wider px-6 py-3 font-sans', /* Paddings ajustados */
            td: 'px-6 py-3 border-b border-slate-100 text-sm text-slate-600', /* Paddings ajustados */
            tr: 'hover:bg-slate-50/80 transition-colors'
          }"
        />
      </div>
    </div>

    <FieldFormModal
      v-model="showModal"
      :field="selectedField"
      :parent-options="parentOptions"
      :saving="isUpdating"
      @save="handleSave"
    />
  </div>
</template>
