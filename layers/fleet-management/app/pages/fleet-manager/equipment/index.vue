<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
import type { Equipment } from '~~/shared/types/db'
import type { TableColumn } from '@nuxt/ui'
import { useEquipment } from '../../../composable/useEquipment'
import { useTeamFleet } from '#layers/fleet-management/app/composable/useTeamFeet' // Añadido para Asignaciones

// COMPONENTES
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UInput = resolveComponent('UInput')
const UIcon = resolveComponent('UIcon')

const toast = useToast()

// COMPOSABLES
const { 
  equipments, isLoading, isSaving, isUpdating,
  fetchEquipments, createEquipment, updateEquipment, deleteEquipment 
} = useEquipment()

const { listFleets, fetchFleets, saveAssignment, disconnectEquipment } = useTeamFleet() // Para el modal de asignación

// ESTADOS GLOBALES
const globalFilter = ref('')
const showModal = ref(false)
const selectedItem = ref<Equipment | null>(null)

// ESTADOS DRAWER & ASIGNACIÓN
const isDetailOpen = ref(false)
const showAssignModal = ref(false)
const selectedEquipment = ref<Equipment | null>(null)

onMounted(() => {
  fetchEquipments()
  fetchFleets() 
})

// --- LÓGICA EQUIPOS (CRUD BASE) ---
const openModal = (item: Equipment | null = null) => {
  selectedItem.value = item
  showModal.value = true
}

const handleSave = async (payload: any) => {
  let ok = false
  if (selectedItem.value?.id) ok = await updateEquipment(selectedItem.value.id, payload)
  else ok = await createEquipment(payload)
  if (ok) showModal.value = false
}

const handleDelete = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar este equipo?')) {
    await deleteEquipment(id)
  }
}

// --- LÓGICA DRAWER Y ASIGNACIONES ---
const openDetail = (e: any, row: any) => {
  selectedEquipment.value = row.original
  isDetailOpen.value = true
}

const handleDisconnectFromDrawer = async (assignmentToRetire: any) => {
  if (confirm(`¿Seguro de desvincular el GPS de la unidad ${assignmentToRetire.placaAuto}?`)) {
    const realId = selectedEquipment.value?.id || assignmentToRetire.equipoId;
    
    const ok = await disconnectEquipment(assignmentToRetire.idAsignacion, realId)
    
    if (ok) {
      isDetailOpen.value = false 
      await fetchEquipments() 
      await fetchFleets() // Refrescar también las flotas para actualizar su estado a "Libre" si es necesario   
    }
  }
}

const handleAssignFromDrawer = (equipment: Equipment) => {
  selectedItem.value = equipment
  isDetailOpen.value = false 
  showAssignModal.value = true
}

const onAssignSaved = async (payload: { flotaId: number, equipoId: number }) => {
  const ok = await saveAssignment(payload)
  if (ok) {
    showAssignModal.value = false
    fetchEquipments() // Refrescar estado a "En Línea"
    fetchFleets() // Refrescar flotas
  }
}

const filteredEquipments = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return equipments.value ?? []
  return (equipments.value ?? []).filter(item => {
    const name = (item.nombre ?? '').toLowerCase()
    const model = (item.modelo ?? '').toLowerCase()
    const code = (item.codigo ?? '').toLowerCase()
    return name.includes(q) || model.includes(q) || code.includes(q)
  })
})

const page = ref(1)
const itemsPerPage = 20

const pagedEquipments = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredEquipments.value.slice(start, start + itemsPerPage)
})

const totalEquipments = computed(() => filteredEquipments.value.length)

watch([globalFilter, totalEquipments], () => {
  page.value = 1
})

// --- TABLA ---
const columns: TableColumn<Equipment>[] = [
  { 
    accessorKey: 'nombre', 
    header: 'Equipo / Dispositivo',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-4' }, [
      h('div', { class: 'w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center border border-slate-200/50' }, [
        h(UIcon, { name: 'i-lucide-cpu', class: 'w-5 h-5 text-slate-400' })
      ]),
      h('div', [
        h('p', { class: 'font-serif text-base font-bold text-slate-950 tracking-tight leading-none' }, row.original.nombre ?? 'Sin nombre'),
        h('p', { class: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1' }, row.original.modelo ?? 'Genérico')
      ])
    ])
  },
  { 
    accessorKey: 'codigo', 
    header: 'IMEI / Identificador',
    cell: ({ row }) => h('span', { 
      class: 'font-mono text-xs font-black text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-none' 
    }, row.original.codigo ?? '-')
  },
  { 
    accessorKey: 'estadoId', 
    header: 'Estado Operativo',
  cell: ({ row }) => {
      // 1 = Libre/Sin asignar, 2 = Asignado/En Línea
      const isAssigned = row.original.estadoId === 2;
      
      return h(UBadge, {
        color: isAssigned ? 'success' : 'neutral', // Emerald para asignado, Gris/Neutral para libre
        variant: 'subtle',
        class: 'rounded-none px-3 font-black uppercase text-[9px] tracking-tighter'
      }, () => isAssigned ? 'Asignado' : 'Disponible') // Texto claro para el usuario
    }
  },
  { 
    id: 'actions', 
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1 px-4' }, [
      h(UButton, {
        icon: 'i-lucide-pencil', variant: 'ghost', color: 'neutral',
        onClick: (e: Event) => { e.stopPropagation(); openModal(row.original); } // Evitar abrir drawer
      }),
      h(UButton, {
        icon: 'i-lucide-trash', variant: 'ghost', color: 'error',
        onClick: (e: Event) => { e.stopPropagation(); handleDelete(row.original.id); } // Evitar abrir drawer
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
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Equipos</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3 font-sans">
            <span>Flota Agricola</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Equipos GPS e IoT</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput 
          v-model="globalFilter" 
          variant="none" 
          placeholder="Buscar IMEI o nombre..." 
          icon="i-lucide-search" 
          class="w-64 font-medium" 
        />
        <div class="w-px h-8 bg-slate-100 mx-3" />
        <UButton 
          color="brand" 
          icon="i-lucide-plus" 
          class="px-6 font-bold text-white bg-primary"
          label="Nuevo Equipo"
          @click="openModal()"
        />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="pagedEquipments"
        :columns="columns"
        :loading="isLoading"
        @select="openDetail"
        sticky
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5 font-sans',
          td: 'px-10 py-6 border-b border-slate-50 text-slate-600 cursor-pointer',
          tr: 'hover:bg-slate-50/50 transition-colors'
        }"
      >
        <template #loading>
          <div class="flex items-center justify-center py-20">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-brand-500" />
          </div>
        </template>
      </UTable>
      
      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ totalEquipments }} unidades registradas
        </p>
        <UPagination
          v-if="totalEquipments > itemsPerPage"
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total="totalEquipments"
          size="xs"
        />
      </div>
    </div>

   <EquipmentDetailDrawer 
  v-model="isDetailOpen" 
  :equipment="selectedEquipment" 
  @disconnect="handleDisconnectFromDrawer"
  @assign="handleAssignFromDrawer" 
/>
    <EquipmentFormModal 
      v-model="showModal" 
      :equipment="selectedItem" 
      :saving="isSaving || isUpdating" 
      @save="handleSave" 
    />

   <AssignGpsModal 
      v-model="showAssignModal" 
      :fleets="listFleets" 
      :gps="selectedItem" 
      @save="onAssignSaved" 
    />
    
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>