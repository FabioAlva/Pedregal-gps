<script setup lang="ts">
import { computed, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GpsAlertLog } from '~~/shared/types/db'


const { logs, loading, fetchAll } = useGpsAlertLogs()
const globalFilter = ref('')

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

const page = ref(1)
const itemsPerPage = 25

const filteredLogs = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return logs.value ?? []
  return (logs.value ?? []).filter(log => (
    String(log.id).includes(q) ||
    String(log.alertaId).includes(q) ||
    String(log.fleetEquipmentId).includes(q) ||
    String(log.valorRegistrado).includes(q)
  ))
})

const pagedLogs = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredLogs.value.slice(start, start + itemsPerPage)
})

const totalLogs = computed(() => filteredLogs.value.length)

watch([globalFilter, totalLogs], () => {
  page.value = 1
})

// --- DEFINICIÓN DE COLUMNAS (Estilo Técnico) ---
const columns: TableColumn<GpsAlertLog>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h('span', { class: 'text-muted font-mono text-[11px]' }, `#${row.original.id}`)
  },
  {
    accessorKey: 'alertaId',
    header: 'Alerta',
    cell: ({ row }) => h('span', { class: 'font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold' }, `ALR-${row.original.alertaId}`)
  },
  {
    accessorKey: 'fleetEquipmentId',
    header: 'Equipo',
    cell: ({ row }) => h('span', { class: 'font-mono text-[10px] px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 font-bold' }, `EQ-${row.original.fleetEquipmentId}`)
  },
  {
    accessorKey: 'valorRegistrado',
    header: 'Valor',
    cell: ({ row }) => h('span', { class: 'font-mono font-black text-highlighted' }, row.original.valorRegistrado)
  },
  {
    accessorKey: 'limiteVigente',
    header: 'Límite',
    cell: ({ row }) => h('span', { class: 'font-mono text-[11px] text-muted' }, row.original.limiteVigente)
  },
  {
    id: 'coords',
    header: 'Ubicación',
    cell: ({ row }) => h('a', {
      href: `https://www.google.com/maps?q=${row.original.lat},${row.original.lng}`,
      target: '_blank',
      class: 'font-mono text-[11px] text-primary hover:underline flex items-center gap-1'
    }, `📍 ${Number(row.original.lat).toFixed(4)}, ${Number(row.original.lng).toFixed(4)}`)
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha / Hora',
    cell: ({ row }) => h('span', { class: 'text-[11px] text-muted font-bold font-mono' }, formatDate(row.original.createdAt))
  }
]

onMounted(fetchAll)
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-background">
    
    <header class="flex items-center justify-between px-6 py-5 border-b border-default shrink-0 bg-elevated/20">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Gestión de Alertas</p>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">Historial de Alertas</h1>
      </div>
      <div class="flex items-center gap-3">
        <UButton 
          icon="i-lucide-refresh-cw" 
          size="sm"
          color="neutral"
          variant="soft"
          label="Actualizar"
          :loading="loading" 
          @click="fetchAll({ force: true })" 
          class="font-bold"
        />
      </div>
    </header>

    <div class="flex items-center gap-4 px-6 py-3 bg-default/30 border-b border-default shrink-0">
      <div class="flex-1 max-w-sm flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-muted tracking-widest whitespace-nowrap">Filtro:</span>
        <UInput 
          v-model="globalFilter" 
          icon="i-lucide-search" 
          placeholder="Buscar equipo, alerta o valor..." 
          size="xs" 
          variant="subtle"
          class="w-full"
        />
      </div>
      
      <div class="h-4 w-[1px] bg-default mx-2"></div>

      <div class="hidden md:flex items-center gap-4 ml-auto">
        <span class="text-[10px] font-black text-muted uppercase tracking-tighter">
          {{ logs?.length ?? 0 }} Registros en memoria
        </span>
      </div>
    </div>

    <main class="flex-1 overflow-hidden relative bg-background">
      <div class="flex flex-col h-full">
        <div class="flex-1 overflow-auto custom-scrollbar">
          <UTable
            :data="pagedLogs"
            :columns="columns"
            :loading="loading"
            class="w-full border-collapse"
            :ui="{ 
              thead: 'sticky top-0 z-20 bg-elevated/95 backdrop-blur-md border-b border-default',
              tr: 'hover:bg-primary/5 transition-colors group border-b border-default/50',
              th: 'p-4 text-[10px] font-black text-muted uppercase tracking-widest text-left',
              td: 'p-4'
            }"
          />

          <div v-if="!loading && totalLogs === 0" class="py-32 flex flex-col items-center justify-center text-muted opacity-40">
            <UIcon name="i-lucide-database-zap" class="w-12 h-12 mb-4" />
            <p class="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron registros</p>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-default bg-default/30 flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-widest text-muted">
            Total: {{ totalLogs }} registros
          </span>
          <UPagination
            v-if="totalLogs > itemsPerPage"
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total="totalLogs"
            size="xs"
          />
        </div>
      </div>
    </main>

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

/* Para que el UTable respete el sticky del header correctamente */
:deep(thead) {
  position: sticky;
  top: 0;
  z-index: 20;
}
</style>