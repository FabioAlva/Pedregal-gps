<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { MaintenanceLog } from '#shared/types/db'
import { useWorkOrders } from '../../composables/useWorkOrders'
import { useFleet } from '#layers/fleet-management/app/composable/useFleet'
import WorkOrderModal from '../../components/WorkOrderModal.vue'

const search = ref('')
const isModalOpen = ref(false)
const selectedOrder = ref<MaintenanceLog | null>(null)

const {
  workOrders,
  isLoading,
  isSaving,
  isUpdating,
  fetchWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder
} = useWorkOrders()

const { fleets, fetchFleets } = useFleet()

onMounted(() => {
  fetchWorkOrders()
  fetchFleets()
})

const fleetMap = computed(() => new Map(fleets.value.map(fleet => [fleet.id, fleet])))

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

const rows = computed(() => workOrders.value
  .map(order => {
    const flota = fleetMap.value.get(order.flotaId)
    return {
      ...order,
      flotaPlaca: flota?.placa ?? 'Sin placa'
    }
  })
  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.flotaPlaca.toLowerCase().includes(q) ||
    (row.realizadoPor ?? '').toLowerCase().includes(q) ||
    (row.descripcion ?? '').toLowerCase().includes(q)
  )
})

const openCreateOrder = () => {
  selectedOrder.value = null
  isModalOpen.value = true
}

const openEditOrder = (order: MaintenanceLog) => {
  selectedOrder.value = order
  isModalOpen.value = true
}

const handleSaveOrder = async (payload: any) => {
  const ok = payload?.id
    ? await updateWorkOrder(payload.id, payload)
    : await createWorkOrder(payload)

  if (ok) {
    isModalOpen.value = false
    selectedOrder.value = null
  }
}

const handleDeleteOrder = async (id: number) => {
  if (confirm('¿Eliminar esta orden?')) {
    await deleteWorkOrder(id)
  }
}
</script>

<template>
  <div class="w-full min-h-screen flex flex-col p-10 font-sans text-slate-900">
    <header class="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between mb-10">
      <div>
        <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Taller y Reparaciones</h1>
        <p class="text-sm text-slate-500 mt-3 max-w-2xl">
          Registra ordenes de trabajo y seguimiento de mantenimiento correctivo.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm">
        <UInput v-model="search" variant="none" placeholder="Buscar orden..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100" />
        <UButton color="primary" icon="i-lucide-plus" class="px-6 font-bold" label="Nueva orden" @click="openCreateOrder" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="px-10 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ filteredRows.length }} ordenes activas
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-10 py-6 space-y-4">
        <div v-if="isLoading" class="text-sm text-slate-500">Cargando ordenes...</div>
        <div v-else-if="filteredRows.length === 0" class="text-sm text-slate-500">Sin ordenes registradas.</div>

        <article
          v-for="order in filteredRows"
          :key="order.id"
          class="border border-slate-100 rounded-2xl p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ order.flotaPlaca }}</p>
              <h3 class="text-base font-bold text-slate-900 mt-2">
                {{ order.descripcion || 'Orden sin descripcion' }}
              </h3>
              <p class="text-xs text-slate-500 mt-2">
                Responsable: {{ order.realizadoPor || 'Sin asignar' }}
              </p>
              <p class="text-[11px] text-slate-400 mt-1">
                {{ formatDateTime(order.fecha) }}
              </p>
              <div class="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500">
                <span>Km: {{ order.kmAlRealizar ?? '-' }}</span>
                <span>Horas: {{ order.horasAlRealizar ?? '-' }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" @click="openEditOrder(order)" />
              <UButton icon="i-lucide-trash" variant="ghost" color="error" @click="handleDeleteOrder(order.id)" />
            </div>
          </div>
        </article>
      </div>
    </div>

    <WorkOrderModal
      v-model="isModalOpen"
      :work-order="selectedOrder"
      :saving="isSaving || isUpdating"
      :fleets="fleets"
      @save="handleSaveOrder"
    />
  </div>
</template>
