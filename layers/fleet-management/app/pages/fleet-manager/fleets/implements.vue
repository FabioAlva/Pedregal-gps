<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Implement } from '~~/shared/types/db'
import { useImplements } from '../../../composable/useImplements'
import { useFleet } from '../../../composable/useFleet'
import ImplementFormModal from '../../../components/implements/ImplementFormModal.vue'
import ImplementDetailDrawer from '../../../components/implements/ImplementDetailDrawer.vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const search = ref('')
const isModalOpen = ref(false)
const selectedImplement = ref<Implement | null>(null)
const selectedImplementDetail = ref<Implement | null>(null)

const isDrawerOpen = computed({
  get: () => !!selectedImplementDetail.value,
  set: (val) => {
    if (!val) selectedImplementDetail.value = null
  }
})

const {
  implementsList,
  isLoading,
  isSaving,
  isUpdating,
  fetchImplements,
  createImplement,
  updateImplement,
  deleteImplement
} = useImplements()

const { fleets, fetchFleets } = useFleet()

onMounted(() => {
  fetchImplements()
  fetchFleets()
})

const fleetMap = computed(() => new Map(fleets.value.map(f => [f.id, f])))

const rows = computed(() => implementsList.value.map(item => ({
  ...item,
  flotaPlaca: item.flotaId ? (fleetMap.value.get(item.flotaId)?.placa ?? 'Sin placa') : 'Sin asignar'
})))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.nombre.toLowerCase().includes(q) ||
    row.tipo.toLowerCase().includes(q) ||
    (row.serie ?? '').toLowerCase().includes(q) ||
    row.flotaPlaca.toLowerCase().includes(q)
  )
})

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'nombre',
    header: 'Implemento',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-4' }, [
      h('div', { class: 'w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center border border-slate-200/50' }, [
        h('span', { class: 'text-sm font-black text-brand-500' }, row.original.nombre?.slice(0, 2).toUpperCase())
      ]),
      h('div', [
        h('p', { class: 'font-serif text-base font-bold text-slate-950 tracking-tight leading-none' }, row.original.nombre),
        h('p', { class: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1' }, row.original.tipo)
      ])
    ])
  },
  {
    accessorKey: 'serie',
    header: 'Serie',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-semibold text-slate-600' }, row.original.serie || '-')
  },
  {
    accessorKey: 'flotaPlaca',
    header: 'Unidad',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.flotaPlaca)
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const map: Record<string, { color: string; label: string }> = {
        OPERATIVO: { color: 'success', label: 'Operativo' },
        EN_REPARACION: { color: 'warning', label: 'En reparacion' },
        INACTIVO: { color: 'neutral', label: 'Inactivo' }
      }
      const status = map[row.original.estado] ?? { color: 'neutral', label: row.original.estado }
      return h(UBadge, { color: status.color as any, variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => status.label)
    }
  },
  {
    accessorKey: 'activo',
    header: 'Uso',
    cell: ({ row }) => h(UBadge, {
      color: row.original.activo ? 'success' : 'neutral',
      variant: 'soft',
      class: 'rounded-none px-3 font-black text-[9px] uppercase'
    }, () => row.original.activo ? 'Activo' : 'Inactivo')
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        color: 'neutral',
        onClick: (event: Event) => { event.stopPropagation(); openEdit(row.original) }
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        onClick: (event: Event) => { event.stopPropagation(); handleDelete(row.original.id) }
      })
    ])
  }
]

const onSelectRow = (_event: Event, row: TableRow<any>) => {
  selectedImplementDetail.value = row.original
}

const openCreate = () => {
  selectedImplement.value = null
  isModalOpen.value = true
}

const openEdit = (item: Implement) => {
  selectedImplement.value = item
  isModalOpen.value = true
}

const handleSave = async (payload: any) => {
  const ok = payload?.id
    ? await updateImplement(payload.id, payload)
    : await createImplement(payload)

  if (ok) {
    isModalOpen.value = false
    selectedImplement.value = null
  }
}

const handleDelete = async (id: number) => {
  if (confirm('¿Eliminar este implemento?')) {
    await deleteImplement(id)
  }
}
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-12">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Implementos</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Flota Agricola</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Implementos</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar implemento..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100 mx-3" />
        <UButton color="brand" icon="i-lucide-plus" class="px-6 font-bold" label="Nuevo implemento" @click="openCreate" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="filteredRows"
        :columns="columns"
        :loading="isLoading"
        @select="onSelectRow"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5',
          td: 'px-10 py-6 border-b border-slate-50 font-sans cursor-pointer',
          tr: 'hover:bg-slate-50/80 transition-all'
        }"
      />

      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ filteredRows.length }} implementos registrados
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>
    </div>

    <ImplementFormModal
      v-model="isModalOpen"
      :implement="selectedImplement"
      :saving="isSaving || isUpdating"
      :fleets="fleets"
      @save="handleSave"
    />

    <ImplementDetailDrawer
      v-model="isDrawerOpen"
      :implement="selectedImplementDetail"
      :fleets="fleets"
    />
  </div>
</template>
