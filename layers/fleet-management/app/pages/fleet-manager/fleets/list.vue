<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import { useFleet } from '../../../composable/useFleet'

// 1. COMPONENTES Y COMPOSABLES
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')

const { fleets, isLoading, isSaving, isUpdating, fetchFleets, createFleet, updateFleet, deleteFleet } = useFleet()

// --- CONTROL DEL DRAWER ---
const selectedVehicle = ref<any>(null)
const isFleetModalOpen = ref(false)
const editingFleet = ref<any | null>(null)

const isDrawerOpen = computed({
  get: () => !!selectedVehicle.value,
  set: (val) => {
    if (!val) selectedVehicle.value = null
  }
})

onMounted(() => fetchFleets())

const openCreateFleet = () => {
  editingFleet.value = null
  isFleetModalOpen.value = true
}

const openEditFleet = (fleet: any) => {
  editingFleet.value = fleet
  isFleetModalOpen.value = true
}

const handleSaveFleet = async (payload: any) => {
  const ok = payload?.id
    ? await updateFleet(payload.id, payload)
    : await createFleet(payload)

  if (ok) {
    isFleetModalOpen.value = false
    editingFleet.value = null
  }
}

const getInitials = (name?: string) => {
  if (!name) return '--'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '--'
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('')
}

watch(isFleetModalOpen, (open) => {
  if (!open) editingFleet.value = null
})

const page = ref(1)
const itemsPerPage = 20

const pagedFleets = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return (fleets.value ?? []).slice(start, start + itemsPerPage)
})

const totalFleets = computed(() => (fleets.value ?? []).length)

watch(totalFleets, () => {
  page.value = 1
})

// 2. COLUMNAS UTABLE V4 (Placa Sans para lectura fácil)
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'placa',
    header: 'Unidad',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-4' }, [
      h(UAvatar, {
        src: row.original.urlFotoUnidad || undefined,
        size: 'lg',
        class: 'rounded-none border border-slate-100 shadow-sm'
      }),
      h('div', [
        h('p', { class: 'font-sans text-lg font-black text-slate-950 tracking-tight leading-none mb-1' }, row.original.placa),
        h('p', { class: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest' }, `${row.original.marca} ${row.original.modelo}`)
      ])
    ])
  },
  {
    accessorKey: 'anho',
    header: 'Año',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-500' }, row.original.anho)
  },
  {
    id: 'conductor',
    header: 'Operador Responsable',
    cell: ({ row }) => {
      const name = row.original.conductor?.nombre
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', {
          class: 'w-8 h-8 border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-600'
        }, getInitials(name)),
        h('span', {
          class: name ? 'text-sm font-semibold text-slate-800' : 'text-sm font-semibold text-slate-400 uppercase tracking-widest'
        }, name || 'Sin Asignar')
      ])
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const statusMap: Record<string, any> = {
        'OPERATIVO': { color: 'success', label: 'Operativo' },
        'MANTENIMIENTO': { color: 'warning', label: 'En Taller' }
      }
      const state = statusMap[row.getValue('estado') as string] || { color: 'neutral', label: row.getValue('estado') }
      return h(UBadge, { color: state.color, variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => state.label)
    }
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h(UDropdownMenu, { 
      items: [[
        { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => openEditFleet(row.original) },
        { label: 'Eliminar', icon: 'i-lucide-trash', color: 'error', onSelect: () => deleteFleet(row.original.id) }
      ]],
      content: { align: 'end' } 
    }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }))
  }
]

const onSelectRow = (e: any, row: TableRow<any>) => {
  selectedVehicle.value = row.original
}
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10  font-sans text-slate-900 overflow-hidden">
    
    <header class="flex items-center justify-between mb-12">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Flota</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Flota Agricola</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Maquinaria y Vehiculos</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput variant="none" placeholder="Buscar placa..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100 mx-3" />
        <UButton color="brand" icon="i-lucide-plus" class="px-6 font-bold bg-primary text-white" label="Nueva Unidad" @click="openCreateFleet" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="pagedFleets"
        :columns="columns"
        :loading="isLoading"
        @select="onSelectRow"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5',
          td: 'px-10 py-6 border-b border-slate-50 cursor-pointer font-sans',
          tr: 'hover:bg-slate-50/80 transition-all'
        }"
      />

      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ totalFleets }} unidades
        </p>
        <UPagination
          v-if="totalFleets > itemsPerPage"
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total="totalFleets"
          size="xs"
        />
      </div>
    </div>

    <FleetDetailDrawer v-model="isDrawerOpen" :vehicle="selectedVehicle" />

    <FleetFormModal
      v-model="isFleetModalOpen"
      :fleet="editingFleet"
      :loading="editingFleet ? isUpdating : isSaving"
      @save="handleSaveFleet"
    />

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>