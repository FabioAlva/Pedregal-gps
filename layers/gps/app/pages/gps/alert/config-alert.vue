<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { GpsAlert } from '~~/shared/types/db'
import { useGpsAlerts } from '#layers/gps/app/composables/useGpsAlerts'
import GpsAlertModal from '#layers/gps/app/components/GpsAlertModal.vue'

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
    await update(payload.id, {
      descripcion: payload.descripcion,
      limiteValor: payload.limiteValor,
      activo: payload.activo
    })
  } else {
    await create({ descripcion: payload.descripcion, limiteValor: payload.limiteValor, activo: payload.activo })
  }
}

const handleToggle = async (alert: GpsAlert) => {
  await updateActive(alert.id, !alert.activo)
}

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

const columns: TableColumn<GpsAlert>[] = [
  { accessorKey: 'id', header: 'ID', cell: ({ row }) => h('span', { class: 'text-muted font-mono text-xs' }, `#${row.original.id}`) },
  { accessorKey: 'descripcion', header: 'Descripción' },
  { accessorKey: 'limiteValor', header: 'Límite', cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.limiteValor) },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => h('span', {
      class: ['text-xs font-semibold px-2 py-1 rounded-full', row.original.activo ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20']
    }, row.original.activo ? 'Activo' : 'Inactivo')
  },
  {
    accessorKey: 'createdAt',
    header: 'Creado',
    cell: ({ row }) => h('span', { class: 'text-xs text-muted font-mono' }, formatDate(row.original.createdAt))
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2 justify-end' }, [
      h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        icon: 'i-lucide-pencil',
        label: 'Editar',
        class: 'border border-primary/20',
        onClick: () => openEdit(row.original)
      }),
      h(UButton, {
        size: 'xs',
        color: row.original.activo ? 'danger' : 'success',
        variant: 'soft',
        icon: row.original.activo ? 'i-lucide-circle-off' : 'i-lucide-toggle-left',
        label: row.original.activo ? 'Desactivar' : 'Activar',
        class: row.original.activo
          ? 'border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15'
          : 'border border-emerald-500/20',
        onClick: () => handleToggle(row.original)
      })
    ])
  }
]

onMounted(fetchAll)
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">Monitoreo GPS</p>
        <h1 class="text-xl font-bold text-highlighted">Configuración de Alertas</h1>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openNew">Nueva alerta</UButton>
    </div>

    <div class="px-5 py-2 bg-default/30 border-b border-default shrink-0">
      <UInput v-model="globalFilter" icon="i-lucide-search" placeholder="Buscar alertas..." size="xs" class="max-w-xs" />
    </div>

    <div class="flex-1 overflow-auto">
      <div class="p-5">
        <div v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</div>
        <UTable
          v-model:global-filter="globalFilter"
          :data="alerts"
          :columns="columns"
          :loading="loading || saving"
          class="w-full"
        />
      </div>
    </div>

    <GpsAlertModal
      v-model="isModalOpen"
      :alert="editing"
      :saving="saving"
      @save="handleSave"
    />
  </div>
</template>
