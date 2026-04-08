<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
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
  const fleet = fleetMap.value.get(schedule.flotaId)
  return {
    ...schedule,
    flotaPlaca: fleet?.placa ?? 'Sin placa'
  }
}))

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return rows.value
  return rows.value.filter(row =>
    row.nombre.toLowerCase().includes(query) ||
    row.flotaPlaca.toLowerCase().includes(query) ||
    (row.descripcion ?? '').toLowerCase().includes(query)
  )
})

const page = ref(1)
const itemsPerPage = 25

const pagedRows = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredRows.value.slice(start, start + itemsPerPage)
})

const totalRows = computed(() => filteredRows.value.length)

watch([search, totalRows], () => {
  page.value = 1
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
        onClick: (event: Event) => {
          event.stopPropagation()
          openEditSchedule(row.original)
        }
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        onClick: (event: Event) => {
          event.stopPropagation()
          handleDeleteSchedule(row.original.id)
        }
      })
    ])
  }
]
</script>

<template>
  <div class="flex h-screen w-full flex-col overflow-hidden p-10 font-sans text-slate-900">
    <header class="mb-12 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold leading-none tracking-tighter text-slate-950">PM Schedules</h1>
          <nav class="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <span>Taller y Papeles</span>
            <UIcon name="i-lucide-chevron-right" class="h-3 w-3 opacity-30" />
            <span class="text-slate-600">Mantenimientos Preventivos</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center gap-3 border border-slate-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar mantenimiento..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="h-8 w-px bg-slate-100" />
        <UButton color="primary" icon="i-lucide-plus" class="px-6 font-bold" label="Nuevo" @click="openCreateSchedule" />
      </div>
    </header>

    <div class="flex flex-1 flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
      <UTable
        :data="pagedRows"
        :columns="columns"
        :loading="isLoading"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400',
          td: 'border-b border-slate-50 px-10 py-6 font-sans',
          tr: 'transition-all hover:bg-slate-50/80'
        }"
      />

      <div class="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-10 py-4">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Total: {{ totalRows }} mantenimientos
        </p>
        <UPagination
          v-if="totalRows > itemsPerPage"
          v-model:page="page"
          :items-per-page="itemsPerPage"
          :total="totalRows"
          size="xs"
        />
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
