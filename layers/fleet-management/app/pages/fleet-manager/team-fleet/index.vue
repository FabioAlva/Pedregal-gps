<script setup lang="ts">

import { h, resolveComponent, ref, onMounted, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Assignment } from '#layers/gps/app/types/ITeemFleet'
import { useTeamFleet } from '../../../composable/useTeamFeet'
import useFilter from '#layers/gps/app/composables/useFilter'
import { useFilterStore } from '#layers/gps/app/stores/useFilterStore'
import { parseLocalDateStr } from '#layers/gps/app/utils/FormatTime'

definePageMeta({ layout: 'fleetmanager' })

// PATRÓN UNIFICADO: Usamos el nuevo composable limpio
const {
  listGps, isLoadingGps, fetchGps, listFleets, saveAssignment, availableGps,
  listAssignments, listActiveAssignments, isLoadingAssignments, fetchAssignments, fetchActiveAssignments, fetchFleets
} = useTeamFleet()

const { refreshDevices } = useFilter()
const filterStore = useFilterStore()
const toast = useToast()

const assignmentView = ref<'active' | 'all'>('active')

// --- PERMISOS ---
const currentPagePermissions = ref({ ver: false, agregar: false, editar: false, eliminar: false })
const canCreateAssignments = computed(() => currentPagePermissions.value.agregar)
const canEditAssignments = computed(() => currentPagePermissions.value.editar)

// --- LÓGICA DE DATOS ---
const assignmentSource = computed(() => 
  assignmentView.value === 'active' ? listActiveAssignments.value : listAssignments.value
)

const displayedAssignments = computed(() => {
  const plate = plateFilter.value.trim().toLowerCase()
  return [...assignmentSource.value]
    .filter(a => !plate || a.placaAuto.toLowerCase().includes(plate))
    .sort((a, b) => (!a.fechaRetiro && b.fechaRetiro ? -1 : 1))
})

const refreshData = async (force = false) => {
  if (assignmentView.value === 'active') await fetchActiveAssignments(force)
  else await fetchAssignments(force)
}

onMounted(() => {
  fetchGps()
  fetchFleets()
  refreshData()
})

watch(assignmentView, () => refreshData(true))

// --- ACCIONES ---
const plateFilter = ref('')
const isModalOpen = ref(false)
const form = ref({ equipoId: null as number | null })

const openAssignModal = (gpsId: number) => {
  if (!canCreateAssignments.value) return showDenied('agregar')
  form.value.equipoId = gpsId
  isModalOpen.value = true
}

const finalizeAssignment = async (assignment: Assignment) => {
  if (!canEditAssignments.value) return showDenied('editar')
  try {
    await $fetch(`/api/equipmentFeet/${assignment.idAsignacion}`, {
      method: 'PATCH',
      body: { retiradoEl: new Date().toISOString() }
    })
    // Liberar equipo (Estado 1: Sin asignar)
    const gps = listGps.value.find(g => g.value === assignment.idGps)
    if (gps?.id) {
      await $fetch(`/api/equipment/${gps.id}`, { method: 'PUT', body: { estadoId: 1 } })
    }
    toast.add({ title: 'Éxito', description: 'Equipo retirado y liberado', color: 'success' })
    refreshDevices()
    refreshData(true)
    fetchGps(true)
  } catch (e) { console.error(e) }
}

const handleSaveAssignment = async (payload: { flotaId: number; equipoId: number }) => {
  const ok = await saveAssignment(payload)
  if (ok) {
    isModalOpen.value = false
    refreshDevices()
    refreshData(true)
    fetchGps(true)
  }
}

const showDenied = (action: string) => {
  toast.add({ title: 'Acceso denegado', description: `No tienes permiso para ${action}`, color: 'warning' })
}

// --- TABLA ---
const UButton = resolveComponent('UButton')
const statusMap: any = {
  1: { label: 'Libre', dot: 'bg-gray-400', text: 'text-gray-400' },
  2: { label: 'Activo', dot: 'bg-green-500', text: 'text-green-400', ping: true },
  3: { label: 'Falla', dot: 'bg-red-500', text: 'text-red-400' }
}

const columns: TableColumn<Assignment>[] = [
  { accessorKey: 'idGps', header: 'ID GPS', cell: ({ row }) => h('span', { class: 'font-mono text-[11px] font-bold' }, row.original.idGps) },
  { accessorKey: 'placaAuto', header: 'Placa', cell: ({ row }) => h('span', { class: 'font-mono text-[11px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/20 uppercase' }, row.original.placaAuto) },
  { accessorKey: 'fechaAsignacion', header: 'Instalado', cell: ({ row }) => h('span', { class: 'text-[11px] font-mono text-muted' }, parseLocalDateStr(row.original.fechaAsignacion)) },
  { accessorKey: 'fechaRetiro', header: 'Retirado', cell: ({ row }) => h('span', { class: 'text-[11px] font-mono text-muted' }, parseLocalDateStr(row.original.fechaRetiro)) },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (row.original.fechaRetiro) return null
      return h('div', { class: 'flex justify-end' }, [
        h(UButton, {
          size: 'xs', color: 'error', variant: 'soft', icon: 'i-lucide-link-2-off', label: 'Retirar',
          onClick: () => finalizeAssignment(row.original)
        })
      ])
    }
  }
]
</script>

<template>
  <div class="flex h-full w-full bg-background overflow-hidden">
    <aside class="w-[300px] shrink-0 border-r border-default flex flex-col bg-elevated/10">
      <div class="px-6 py-5 border-b border-default shrink-0">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Hardware</p>
        <h2 class="text-lg font-bold text-highlighted">Inventario GPS</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        <div v-if="isLoadingGps" class="flex flex-col items-center py-10 opacity-40">
          <div class="w-5 h-5 border-2 border-t-primary rounded-full animate-spin mb-2" />
          <span class="text-[10px] font-bold uppercase tracking-widest">Cargando...</span>
        </div>

        <div v-for="gps in listGps" v-else :key="gps.id" 
          class="p-4 rounded-xl border border-default bg-elevated shadow-sm transition-all hover:border-primary/30">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span :class="['h-2 w-2 rounded-full', statusMap[gps.state]?.dot]" />
              <span class="text-sm font-black text-highlighted">{{ gps.name }}</span>
            </div>
            <span :class="['text-[9px] font-black uppercase', statusMap[gps.state]?.text]">{{ statusMap[gps.state]?.label }}</span>
          </div>
          
          <div class="text-[10px] space-y-1 mb-3">
            <div class="flex justify-between font-mono"><span class="text-muted">ID:</span><span class="font-bold">{{ gps.value }}</span></div>
          </div>

          <UButton 
            v-if="gps.state === 1" 
            size="xs" color="primary" block variant="soft" label="Asignar" icon="i-lucide-link"
            class="font-bold uppercase text-[10px]"
            @click="openAssignModal(Number(gps.id))" 
          />
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      <header class="px-6 py-5 border-b border-default flex items-center justify-between bg-elevated/20">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Operaciones</p>
          <h1 class="text-2xl font-bold text-highlighted tracking-tight">Asignaciones</h1>
        </div>
      </header>

      <div class="px-6 py-3 border-b border-default bg-default/30 flex items-center gap-4">
        <UInput v-model="plateFilter" size="xs" placeholder="Filtrar placa..." icon="i-lucide-search" variant="subtle" class="w-48" />
        <USelect v-model="assignmentView" :items="[{label:'Vigentes', value:'active'}, {label:'Todas', value:'all'}]" size="xs" variant="subtle" class="w-32 font-bold" />
      </div>

      <div class="flex-1 overflow-hidden relative">
        <div v-if="isLoadingAssignments" class="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
           <div class="w-6 h-6 border-2 border-t-primary rounded-full animate-spin" />
        </div>
        
        <div class="h-full overflow-auto custom-scrollbar">
          <UTable :data="displayedAssignments" :columns="columns" class="w-full"
            :ui="{ th: 'p-4 text-[10px] font-black text-muted uppercase tracking-widest', td: 'p-4' }" />
        </div>
      </div>
    </main>

    <AssignGpsModal 
      v-model="isModalOpen" 
      :fleets="listFleets" 
      :gps-list="availableGps.map(g => ({ ...g, id: Number(g.id) }))" 
      :initial-gps-id="form.equipoId ?? undefined" 
      @save="handleSaveAssignment" 
    />
  </div>
</template>

