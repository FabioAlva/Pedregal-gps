<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GpsAlert } from '~~/shared/types/db'

const { alerts, loading, saving, error, fetchAll, updateActive, create, update } = useGpsAlerts()
const UButton = resolveComponent('UButton')

const globalFilter = ref('')
const isModalOpen = ref(false)
const editing = ref<GpsAlert | null>(null)

const openNew = () => {
  editing.value = null
  isModalOpen.value = true
}

const openEdit = (alert: GpsAlert) => {
  editing.value = alert
  isModalOpen.value = true
}

const handleSave = async (payload: { id?: number, descripcion: string, limiteValor: number, activo: boolean }) => {
  if (payload.id) {
    await update(payload.id, payload)
  } else {
    await create(payload)
  }
  isModalOpen.value = false 
}

const handleToggle = async (alert: GpsAlert) => {
  await updateActive(alert.id, !alert.activo)
}

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

const page = ref(1)
const itemsPerPage = 20

const filteredAlerts = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return alerts.value ?? []
  return (alerts.value ?? []).filter(alert =>
    String(alert.id).includes(q) ||
    alert.descripcion.toLowerCase().includes(q)
  )
})

const pagedAlerts = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredAlerts.value.slice(start, start + itemsPerPage)
})

const totalAlerts = computed(() => filteredAlerts.value.length)

watch([globalFilter, totalAlerts], () => {
  page.value = 1
})

// --- COLUMNAS CON ESTILO HOMOGÉNEO ---
const columns: TableColumn<GpsAlert>[] = [
  { 
    accessorKey: 'id', 
    header: '#', 
    cell: ({ row }) => h('span', { class: 'text-muted font-mono text-[11px]' }, `#${row.original.id}`) 
  },
  { 
    accessorKey: 'descripcion', 
    header: 'Descripción Alerta',
    cell: ({ row }) => h('span', { class: 'font-bold text-highlighted text-[13px]' }, row.original.descripcion)
  },
  { 
    accessorKey: 'limiteValor', 
    header: 'Umbral/Límite', 
    cell: ({ row }) => h('span', { class: 'font-mono text-[12px] font-black text-primary' }, row.original.limiteValor) 
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => h('span', {
      class: [
        'text-[10px] font-black uppercase px-2 py-1 rounded-md border tracking-tighter', 
        row.original.activo 
          ? 'bg-green-500/10 text-green-600 border-green-500/20' 
          : 'bg-red-500/10 text-red-600 border-red-500/20'
      ]
    }, row.original.activo ? 'Activo' : 'Inactivo')
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha Registro',
    cell: ({ row }) => h('span', { class: 'text-[11px] text-muted font-mono' }, formatDate(row.original.createdAt))
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2 justify-end' }, [
      h(UButton, {
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-pencil',
        onClick: () => openEdit(row.original)
      }),
      h(UButton, {
        size: 'xs',
        color: row.original.activo ? 'error' : 'success',
        variant: 'soft',
        icon: row.original.activo ? 'i-lucide-circle-off' : 'i-lucide-check-circle',
        label: row.original.activo ? 'Baja' : 'Alta',
        class: 'font-bold uppercase text-[9px]',
        onClick: () => handleToggle(row.original)
      })
    ])
  }
]

onMounted(fetchAll)
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden bg-background">
    
    <header class="flex items-center justify-between px-6 py-5 border-b border-default shrink-0 bg-elevated/20">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Mantenimiento GPS</p>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">Configuración de Alertas</h1>
      </div>
      <div class="flex items-center gap-3">
        <UButton 
          label="Crear Alerta" 
          icon="i-lucide-plus" 
          size="sm" 
          color="primary" 
          class="font-bold shadow-lg shadow-primary/10"
          @click="openNew" 
        />
      </div>
    </header>

    <div class="flex items-center gap-4 px-6 py-3 bg-default/30 border-b border-default shrink-0">
      <div class="flex-1 max-w-sm flex items-center gap-2">
        <span class="text-[10px] font-black uppercase text-muted tracking-widest whitespace-nowrap">Buscar:</span>
        <UInput 
          v-model="globalFilter" 
          icon="i-lucide-search" 
          placeholder="Filtrar por nombre o ID..." 
          size="xs" 
          variant="subtle"
          class="w-full"
        />
      </div>
      
      <div class="h-4 w-[1px] bg-default mx-2"></div>

      <div class="hidden md:flex items-center gap-4 ml-auto">
        <span v-if="error" class="text-xs text-red-500 font-bold animate-pulse">{{ error }}</span>
        <span class="text-[10px] font-black text-muted uppercase tracking-tighter">
          {{ alerts?.length ?? 0 }} Reglas definidas
        </span>
      </div>
    </div>

    <main class="flex-1 overflow-hidden relative bg-background">
      <div class="flex flex-col h-full">
        <div class="flex-1 overflow-auto custom-scrollbar">
        <UTable
          :data="pagedAlerts"
          :columns="columns"
          :loading="loading || saving"
          class="w-full border-collapse"
          :ui="{ 
            thead: 'sticky top-0 z-20 bg-elevated/95 backdrop-blur-md border-b border-default',
            tr: 'hover:bg-primary/5 transition-colors group border-b border-default/50',
            th: 'p-4 text-[10px] font-black text-muted uppercase tracking-widest text-left',
            td: 'p-4'
          }"
        />

          <div v-if="!loading && totalAlerts === 0" class="py-32 flex flex-col items-center justify-center text-muted opacity-40">
            <UIcon name="i-lucide-bell-off" class="w-12 h-12 mb-4" />
            <p class="text-[10px] font-black uppercase tracking-[0.3em]">No hay alertas configuradas</p>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-default bg-default/30 flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-widest text-muted">
            Total: {{ totalAlerts }} reglas
          </span>
          <UPagination
            v-if="totalAlerts > itemsPerPage"
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total="totalAlerts"
            size="xs"
          />
        </div>
      </div>
    </main>

    <GpsAlertModal
      v-model="isModalOpen"
      :alert="editing"
      :saving="saving"
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