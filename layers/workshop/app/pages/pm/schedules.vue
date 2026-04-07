<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { MaintenanceSchedule } from '#shared/types/db'
import { useMaintenanceSchedules } from '../../composables/useMaintenanceSchedules'
import { useFleet } from '#layers/fleet-management/app/composable/useFleet'
import MaintenanceScheduleModal from '../../components/MaintenanceScheduleModal.vue'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const search = ref('')
const isModalOpen = ref(false)
const selectedSchedule = ref<MaintenanceSchedule | null>(null)

const {
  schedules,
  isLoading,
  isSaving,
  isUpdating,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} = useMaintenanceSchedules()

const { fleets, fetchFleets } = useFleet()

onMounted(() => {
  fetchSchedules()
  fetchFleets()
})

const fleetMap = computed(() => new Map(fleets.value.map(fleet => [fleet.id, fleet])))

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-PE')
}

const formatInterval = (value?: number | null, unit?: string) => {
  if (value == null) return null
  return `${value} ${unit}`
}

const rows = computed(() => schedules.value.map(schedule => {
  const flota = fleetMap.value.get(schedule.flotaId)
  return {
    ...schedule,
    flotaPlaca: flota?.placa ?? 'Sin placa'
  }
}))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.nombre.toLowerCase().includes(q) ||
    row.flotaPlaca.toLowerCase().includes(q) ||
    (row.descripcion ?? '').toLowerCase().includes(q)
  )
})

const openCreateSchedule = () => {
  selectedSchedule.value = null
  isModalOpen.value = true
}

const openEditSchedule = (schedule: MaintenanceSchedule) => {
  selectedSchedule.value = schedule
  isModalOpen.value = true
}

const handleSaveSchedule = async (payload: any) => {
  const ok = payload?.id
    ? await updateSchedule(payload.id, payload)
    : await createSchedule(payload)

  if (ok) {
    isModalOpen.value = false
    selectedSchedule.value = null
  }
}

const handleDeleteSchedule = async (id: number) => {
  if (confirm('¿Eliminar este mantenimiento?')) {
    await deleteSchedule(id)
  }
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'flotaPlaca',
    header: 'Unidad',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.flotaPlaca)
  },
  {
    accessorKey: 'nombre',
    header: 'Mantenimiento',
    cell: ({ row }) => h('div', [
      h('p', { class: 'text-sm font-bold text-slate-900' }, row.original.nombre),
      h('p', { class: 'text-[11px] text-slate-500' }, row.original.descripcion ?? 'Sin descripcion')
    ])
  },
  {
    id: 'intervalos',
    header: 'Intervalos',
    cell: ({ row }) => {
      const km = formatInterval(row.original.intervaloKm, 'km')
      const hrs = formatInterval(row.original.intervaloHoras, 'h')
      const days = formatInterval(row.original.intervaloDias, 'dias')
      const value = [km, hrs, days].filter(Boolean).join(' • ')
      return h('span', { class: 'text-xs font-semibold text-slate-500' }, value || '-')
    }
  },
  {
    id: 'ultimo',
    header: 'Ultimo registro',
    cell: ({ row }) => {
      const km = formatInterval(row.original.ultimoKm, 'km')
      const hrs = formatInterval(row.original.ultimasHoras, 'h')
      const date = formatDate(row.original.ultimaFecha)
      const value = [km, hrs].filter(Boolean).join(' • ')
      return h('div', [
        h('p', { class: 'text-xs font-semibold text-slate-600' }, value || '-'),
        h('p', { class: 'text-[11px] text-slate-400' }, date)
      ])
    }
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => h(UBadge, {
      color: row.original.activo ? 'success' : 'neutral',
      variant: 'subtle',
      class: 'rounded-none px-3 font-black text-[9px] uppercase'
    }, () => (row.original.activo ? 'Activo' : 'Inactivo'))
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        color: 'neutral',
        onClick: (event: Event) => { event.stopPropagation(); openEditSchedule(row.original) }
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        onClick: (event: Event) => { event.stopPropagation(); handleDeleteSchedule(row.original.id) }
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
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">PM Schedules</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Taller y Papeles</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Mantenimientos Preventivos</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar mantenimiento..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100" />
        <UButton color="primary" icon="i-lucide-plus" class="px-6 font-bold" label="Nuevo" @click="openCreateSchedule" />
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
          Total: {{ filteredRows.length }} mantenimientos
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>
    </div>

    <MaintenanceScheduleModal
      v-model="isModalOpen"
      :schedule="selectedSchedule"
      :saving="isSaving || isUpdating"
      :fleets="fleets"
      @save="handleSaveSchedule"
    />
  </div>
</template>
