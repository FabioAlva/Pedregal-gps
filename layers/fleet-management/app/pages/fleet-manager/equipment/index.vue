<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from 'vue'
import type { Equipment } from '~~/shared/types/db'
import type { TableColumn } from '@nuxt/ui'
import { useEquipment } from '../../../composable/useEquipment'

definePageMeta({ layout: 'fleetmanager' })

const { 
  equipments, 
  isLoading, 
  isSaving, 
  isUpdating,
  fetchEquipments, 
  createEquipment,
  updateEquipment,
  deleteEquipment 
} = useEquipment()

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const globalFilter = ref('')
const showModal = ref(false)
const selectedItem = ref<Equipment | null>(null)

onMounted(() => {
  fetchEquipments()
})

const openModal = (item: Equipment | null = null) => {
  selectedItem.value = item
  showModal.value = true
}

const handleSave = async (payload: any) => {
  let ok = false
  if (selectedItem.value?.id) {
    ok = await updateEquipment(selectedItem.value.id, payload)
  } else {
    ok = await createEquipment(payload)
  }
  
  if (ok) showModal.value = false
}

const handleDelete = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar este equipo?')) {
    await deleteEquipment(id)
  }
}

const columns: TableColumn<Equipment>[] = [
  { 
    accessorKey: 'id', 
    header: '#', 
    cell: ({ row }) => h('span', { class: 'text-muted font-mono text-[11px]' }, `#${row.original.id}`) 
  },
  { 
    accessorKey: 'nombre', 
    header: 'Equipo',
    cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'font-bold text-highlighted text-[13px]' }, row.original.nombre ?? 'Sin nombre'),
      h('span', { class: 'text-[10px] text-muted' }, row.original.modelo ?? '-')
    ])
  },
  { 
    accessorKey: 'codigo', 
    header: 'IMEI / Código',
    cell: ({ row }) => h('span', { 
      class: 'font-mono text-[11px] bg-default px-1.5 py-0.5 rounded border border-default' 
    }, row.original.codigo ?? '-')
  },
  { 
    accessorKey: 'estadoId', 
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.estadoId === 1 ? 'success' : 'warning',
      variant: 'subtle', size: 'xs', class: 'font-black uppercase text-[9px]'
    }, () => row.original.estadoId === 1 ? 'Activo' : 'Inactivo')
  },
  { 
    id: 'actions', 
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil', variant: 'ghost', color: 'neutral', size: 'xs',
        onClick: () => openModal(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-trash', variant: 'ghost', color: 'error', size: 'xs',
        onClick: () => handleDelete(row.original.id)
      })
    ])
  }
]
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-background">
    <header class="flex items-center justify-between px-6 py-5 border-b border-default shrink-0 bg-elevated/20">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Activos & Hardware</p>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">Gestión de Equipos</h1>
      </div>
      <UButton label="Nuevo Equipo" icon="i-lucide-plus" size="sm" color="primary" @click="openModal()" />
    </header>

    <div class="flex items-center gap-4 px-6 py-3 bg-default/30 border-b border-default shrink-0 text-xs">
      <UInput v-model="globalFilter" icon="i-lucide-search" placeholder="Buscar..." size="xs" variant="subtle" class="w-64" />
      <div class="ml-auto text-muted font-bold tracking-tighter uppercase text-[10px]">
        {{ equipments?.length ?? 0 }} Equipos en sistema
      </div>
    </div>

    <main class="flex-1 overflow-hidden relative">
      <UTable
        v-model:global-filter="globalFilter"
        :data="equipments ?? []"
        :columns="columns"
        :loading="isLoading"
        class="w-full h-full overflow-auto"
        :ui="{ thead: 'sticky top-0 z-20 bg-background', td: 'p-4' }"
      />
    </main>

    <EquipmentFormModal 
      v-model="showModal" 
      :equipment="selectedItem" 
      :saving="isSaving || isUpdating" 
      @save="handleSave" 
    />
  </div>
</template>