<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GpsAlertLog } from '~~/shared/types/db'

const { logs, loading, fetchAll } = useGpsAlertLogs()
const globalFilter = ref('')

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

const columns: TableColumn<GpsAlertLog>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h('span', { class: 'text-muted font-mono text-xs' }, `#${row.original.id}`)
  },
  {
    accessorKey: 'alertaId',
    header: 'Alerta',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20' }, `ALR-${row.original.alertaId}`)
  },
  {
    accessorKey: 'fleetEquipmentId',
    header: 'Equipo',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20' }, `EQ-${row.original.fleetEquipmentId}`)
  },
  {
    accessorKey: 'valorRegistrado',
    header: 'Valor',
    cell: ({ row }) => h('span', { class: 'font-mono font-semibold text-highlighted' }, row.original.valorRegistrado)
  },
  {
    accessorKey: 'limiteVigente',
    header: 'Límite',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted' }, row.original.limiteVigente)
  },
  {
    id: 'coords',
    header: 'Ubicación',
    cell: ({ row }) => h('a', {
      href: `https://www.google.com/maps?q=${row.original.lat},${row.original.lng}`,
      target: '_blank',
      class: 'font-mono text-xs text-primary hover:underline'
    }, `📍 ${Number(row.original.lat).toFixed(4)}, ${Number(row.original.lng).toFixed(4)}`)
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => h('span', { class: 'text-xs text-muted font-mono' }, formatDate(row.original.createdAt))
  }
]

onMounted(fetchAll)
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">Monitoreo GPS</p>
        <h1 class="text-xl font-bold text-highlighted">Historial de Alertas</h1>
      </div>
      <UButton 
        color="neutral" 
        variant="ghost" 
        icon="i-lucide-refresh-cw" 
        :loading="loading" 
        @click="fetchAll({ force: true })" 
      />
    </div>

    <div class="px-5 py-2 bg-default/30 border-b border-default shrink-0">
      <UInput v-model="globalFilter" icon="i-lucide-search" placeholder="Buscar en historial..." size="xs" class="max-w-xs" />
    </div>

    <div class="flex-1 overflow-auto">
      <UTable
        v-model:global-filter="globalFilter"
        :data="logs ?? []"
        :columns="columns"
        :loading="loading"
        class="w-full"
      />
    </div>
  </div>
</template>