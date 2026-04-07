<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { InventoryPart } from '#shared/types/db'
import { useInventoryParts } from '../../composables/useInventoryParts'
import InventoryPartModal from '../../components/InventoryPartModal.vue'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const search = ref('')
const isModalOpen = ref(false)
const selectedPart = ref<InventoryPart | null>(null)

const {
  parts,
  isLoading,
  isSaving,
  isUpdating,
  fetchParts,
  createPart,
  updatePart,
  deletePart
} = useInventoryParts()

onMounted(() => {
  fetchParts()
})

const rows = computed(() => parts.value.map(part => ({
  ...part,
  isLow: part.stockActual <= part.stockMinimo
})))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.nombre.toLowerCase().includes(q) ||
    (row.sku ?? '').toLowerCase().includes(q) ||
    (row.ubicacion ?? '').toLowerCase().includes(q)
  )
})

const openCreatePart = () => {
  selectedPart.value = null
  isModalOpen.value = true
}

const openEditPart = (part: InventoryPart) => {
  selectedPart.value = part
  isModalOpen.value = true
}

const handleSavePart = async (payload: any) => {
  const ok = payload?.id
    ? await updatePart(payload.id, payload)
    : await createPart(payload)

  if (ok) {
    isModalOpen.value = false
    selectedPart.value = null
  }
}

const handleDeletePart = async (id: number) => {
  if (confirm('¿Eliminar este repuesto?')) {
    await deletePart(id)
  }
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'nombre',
    header: 'Repuesto',
    cell: ({ row }) => h('div', [
      h('p', { class: 'text-sm font-bold text-slate-900' }, row.original.nombre),
      h('p', { class: 'text-[11px] text-slate-500' }, row.original.descripcion ?? 'Sin descripcion')
    ])
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.sku ?? '-')
  },
  {
    accessorKey: 'stockActual',
    header: 'Stock',
    cell: ({ row }) => h('div', [
      h('p', { class: 'text-xs font-bold text-slate-700' }, `${row.original.stockActual} ${row.original.unidad ?? ''}`),
      h('p', { class: 'text-[11px] text-slate-400' }, `Min: ${row.original.stockMinimo}`)
    ])
  },
  {
    accessorKey: 'ubicacion',
    header: 'Ubicacion',
    cell: ({ row }) => h('span', { class: 'text-xs font-semibold text-slate-500' }, row.original.ubicacion ?? '-')
  },
  {
    id: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      if (!row.original.activo) {
        return h(UBadge, { color: 'neutral', variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => 'Inactivo')
      }
      if (row.original.isLow) {
        return h(UBadge, { color: 'warning', variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => 'Bajo stock')
      }
      return h(UBadge, { color: 'success', variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => 'Ok')
    }
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        color: 'neutral',
        onClick: (event: Event) => { event.stopPropagation(); openEditPart(row.original) }
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        onClick: (event: Event) => { event.stopPropagation(); handleDeletePart(row.original.id) }
      })
    ])
  }
]
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-12">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Repuestos</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Taller y Papeles</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Almacen</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar repuesto..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100" />
        <UButton color="primary" icon="i-lucide-plus" class="px-6 font-bold" label="Nuevo" @click="openCreatePart" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="filteredRows"
        :columns="columns"
        :loading="isLoading"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5',
          td: 'px-10 py-6 border-b border-slate-50 font-sans',
          tr: 'hover:bg-slate-50/80 transition-all'
        }"
      />

      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ filteredRows.length }} repuestos
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>
    </div>

    <InventoryPartModal
      v-model="isModalOpen"
      :part="selectedPart"
      :saving="isSaving || isUpdating"
      @save="handleSavePart"
    />
  </div>
</template>
