<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from 'vue'
import type { Fleet } from '~~/shared/types/db'
import type { TableColumn } from '@nuxt/ui'
import { useFleet } from '../../../composable/useFleet'

definePageMeta({ layout: 'fleetmanager' })

const { 
  fleets, 
  isLoading, 
  isSaving, 
  fetchFleets, 
  createFleet,
    updateFleet,
    deleteFleet 
} = useFleet()

const UButton = resolveComponent('UButton')
const globalFilter = ref('')
const showModal = ref(false)
const selectedItem = ref<Fleet | null>(null)

onMounted(() => {
  fetchFleets()
})

// --- COLUMNAS CON ESTILO TÉCNICO Y LIMPIO ---
const columns: TableColumn<Fleet>[] = [
  { 
    accessorKey: 'id', 
    header: '#', 
    cell: ({ row }) => h('span', { class: 'text-muted font-mono text-[11px]' }, `#${row.original.id}`) 
  },
  { 
    accessorKey: 'marca', 
    header: 'Marca / Fabricante',
    cell: ({ row }) => h('span', { class: 'font-bold text-highlighted text-[13px]' }, row.original.marca)
  },
  { 
    accessorKey: 'modelo', 
    header: 'Modelo',
    cell: ({ row }) => h('span', { class: 'text-muted font-medium' }, row.original.modelo)
  },
  { 
    accessorKey: 'placa', 
    header: 'Placa',
    cell: ({ row }) => h('span', { 
      class: 'font-mono text-[11px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/20 tracking-wider uppercase' 
    }, row.original.placa)
  },
  { 
    accessorKey: 'anho', 
    header: 'Año',
    cell: ({ row }) => h('span', { class: 'text-[11px] font-bold text-muted' }, row.original.anho)
  },
  { 
    id: 'actions', 
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        color: 'neutral',
        size: 'xs',
        onClick: () => openModal(row.original)
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        size: 'xs',
        onClick: () => handleDelete(Number(row.original.id))
      })
    ])
  }
]

const openModal = (item: Fleet | null = null) => {
  selectedItem.value = item
  showModal.value = true
}

const handleSave = async (payload: any) => {
  const id = selectedItem.value?.id
  const ok = id 
    ? await updateFleet(id, payload) 
    : await createFleet(payload)
    
  if (ok) showModal.value = false
}

const handleDelete = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar esta flota?')) {
    await deleteFleet(id)
  }
}
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-background">
    
    <header class="flex items-center justify-between px-6 py-5 border-b border-default shrink-0 bg-elevated/20">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Logística & Unidades</p>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">Gestión de Flotas</h1>
      </div>
      <div class="flex items-center gap-3">
        <UButton 
          label="Nueva Unidad" 
          icon="i-lucide-plus" 
          size="sm" 
          color="primary" 
          class="font-bold shadow-lg shadow-primary/10"
          @click="openModal()" 
        />
      </div>
    </header>

    <div class="flex items-center gap-4 px-6 py-3 bg-default/30 border-b border-default shrink-0">
      <div class="flex-1 max-w-sm flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-muted tracking-widest whitespace-nowrap">Buscar:</span>
        <UInput 
          v-model="globalFilter" 
          icon="i-lucide-search" 
          placeholder="Placa, marca o modelo..." 
          size="xs" 
          variant="subtle"
          class="w-full"
        />
      </div>
      
      <div class="h-4 w-[1px] bg-default mx-2"></div>

      <div class="hidden md:flex items-center gap-4 ml-auto">
        <span class="text-[10px] font-black text-muted uppercase tracking-tighter">
          {{ fleets?.length ?? 0 }} Unidades registradas
        </span>
      </div>
    </div>

    <main class="flex-1 overflow-hidden relative bg-background">
      <div class="h-full overflow-auto custom-scrollbar">
        <UTable
          v-model:global-filter="globalFilter"
          :data="fleets ?? []"
          :columns="columns"
          :loading="isLoading"
          class="w-full border-collapse"
          :ui="{ 
            thead: 'sticky top-0 z-20 bg-elevated/95 backdrop-blur-md border-b border-default',
            tr: 'hover:bg-primary/5 transition-colors group border-b border-default/50',
            th: 'p-4 text-[10px] font-black text-muted uppercase tracking-widest text-left',
            td: 'p-4'
          }"
        />

        <div v-if="!isLoading && fleets?.length === 0" class="py-32 flex flex-col items-center justify-center text-muted opacity-40">
          <UIcon name="i-lucide-truck" class="w-12 h-12 mb-4" />
          <p class="text-[10px] font-black uppercase tracking-[0.3em]">No hay unidades en flota</p>
        </div>
      </div>
    </main>

    <FleetFormModal 
      v-model="showModal" 
      :fleet="selectedItem" 
      :saving="isSaving" 
      @save="handleSave" 
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: rgba(var(--color-primary-500), 0.1); 
  border-radius: 10px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--color-primary-500), 0.3); }

:deep(thead) {
  position: sticky;
  top: 0;
  z-index: 20;
}
</style>