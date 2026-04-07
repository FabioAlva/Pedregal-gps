<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInspections } from '../../composables/useInspections'

const search = ref('')
const selectedInspectionId = ref<number | null>(null)

const {
  inspections,
  details,
  isLoading,
  fetchInspections,
  fetchInspectionDetail
} = useInspections()

onMounted(() => {
  fetchInspections()
})

const formatDate = (value?: string | Date | number | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const estadoColor = (estado: string) => {
  if (estado === 'CRITICO') return 'error'
  if (estado === 'OBSERVADO') return 'warning'
  return 'success'
}

const rows = computed(() => inspections.value.map(row => ({
  ...row,
  operadorNombre: row.operadorNombres || row.operadorApellidos
    ? `${row.operadorNombres ?? ''} ${row.operadorApellidos ?? ''}`.trim()
    : 'Sin operador',
  plantillaNombre: row.plantillaNombre ?? 'Sin plantilla'
})))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.flotaPlaca?.toLowerCase().includes(q) ||
    row.operadorNombre.toLowerCase().includes(q) ||
    row.plantillaNombre.toLowerCase().includes(q) ||
    row.estado.toLowerCase().includes(q)
  )
})

const onSelectRow = async (inspectionId: number) => {
  selectedInspectionId.value = inspectionId
  await fetchInspectionDetail(inspectionId)
}

const isDetailOpen = computed({
  get: () => selectedInspectionId.value !== null,
  set: (value) => {
    if (!value) selectedInspectionId.value = null
  }
})

const selectedDetail = computed(() => {
  if (!selectedInspectionId.value) return null
  return details.value[selectedInspectionId.value] || null
})

const responseEntries = computed(() => {
  const detail = selectedDetail.value
  if (!detail?.esquemaSnapshot || !detail.respuestas) return []

  return detail.esquemaSnapshot.map((field: any) => {
    const value = detail.respuestas?.[field.id]
    let formatted = '-'

    if (field.tipo === 'boolean') {
      formatted = value?.value === false ? 'No' : 'Si'
    } else if (value != null && value !== '') {
      formatted = String(value)
    }

    return {
      id: field.id,
      label: field.label,
      tipo: field.tipo,
      value: formatted,
      nota: value?.nota
    }
  })
})
</script>

<template>
  <div class="w-full min-h-screen flex flex-col p-10 font-sans text-slate-900">
    <header class="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between mb-10">
      <div>
        <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Historial DVIR</h1>
        <p class="text-sm text-slate-500 mt-3 max-w-2xl">
          Revisa inspecciones pasadas, observaciones y problemas reportados.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm">
        <UInput v-model="search" variant="none" placeholder="Buscar inspeccion..." icon="i-lucide-search" class="w-64 font-medium" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ filteredRows.length }} inspecciones registradas
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-10 py-6 space-y-4">
        <div v-if="isLoading" class="text-sm text-slate-500">Cargando inspecciones...</div>
        <div v-else-if="filteredRows.length === 0" class="text-sm text-slate-500">Sin registros por ahora.</div>

        <div
          v-for="row in filteredRows"
          :key="row.id"
          class="border border-slate-100 rounded-2xl p-5 flex flex-col gap-4"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-slate-400">{{ formatDate(row.createdAt) }}</p>
              <h3 class="text-lg font-bold text-slate-900 mt-1">{{ row.flotaPlaca || 'Sin placa' }}</h3>
              <p class="text-xs text-slate-500 mt-1">
                {{ row.operadorNombre }} · {{ row.plantillaNombre }}
              </p>
            </div>
            <UBadge :color="estadoColor(row.estado)" variant="subtle" class="text-[10px] font-black uppercase">
              {{ row.estado }}
            </UBadge>
          </div>

          <div class="flex justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-eye"
              label="Ver detalle"
              @click="onSelectRow(row.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="isDetailOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
      <template #content>
        <div class="w-full max-w-[780px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
          <div class="bg-slate-950 p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Detalle DVIR</span>
                <h3 class="text-xl font-black tracking-tight mt-1">
                  {{ selectedDetail?.flotaPlaca || 'Inspeccion' }}
                </h3>
                <p class="text-xs text-slate-300">{{ formatDate(selectedDetail?.createdAt) }}</p>
              </div>
              <UBadge
                v-if="selectedDetail"
                :color="estadoColor(selectedDetail.estado)"
                variant="subtle"
                class="text-[10px] font-black uppercase"
              >
                {{ selectedDetail.estado }}
              </UBadge>
            </div>
          </div>

          <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-xs text-slate-500">
                <div class="font-bold text-slate-800">Operador</div>
                <div>{{ selectedDetail?.operadorNombres || 'Sin operador' }} {{ selectedDetail?.operadorApellidos || '' }}</div>
              </div>
              <div class="text-xs text-slate-500">
                <div class="font-bold text-slate-800">Plantilla</div>
                <div>{{ selectedDetail?.plantillaNombre || 'Sin plantilla' }}</div>
              </div>
              <div class="text-xs text-slate-500">
                <div class="font-bold text-slate-800">Tipo</div>
                <div>{{ selectedDetail?.tipo || '-' }}</div>
              </div>
              <div class="text-xs text-slate-500">
                <div class="font-bold text-slate-800">Observaciones</div>
                <div>{{ selectedDetail?.observaciones || 'Sin observaciones' }}</div>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Respuestas</h4>
              <div class="mt-4 space-y-3">
                <div
                  v-for="entry in responseEntries"
                  :key="entry.id"
                  class="border border-slate-100 rounded-2xl p-4"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-semibold text-slate-800">{{ entry.label }}</p>
                      <p class="text-[11px] text-slate-400">{{ entry.tipo }}</p>
                    </div>
                    <UBadge color="neutral" variant="subtle" class="text-[10px] font-black uppercase">
                      {{ entry.value }}
                    </UBadge>
                  </div>
                  <div v-if="entry.nota" class="mt-2 text-xs text-slate-500">
                    Nota: {{ entry.nota }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Problemas reportados</h4>
              <div class="mt-3 space-y-2">
                <div v-if="!selectedDetail?.issues?.length" class="text-sm text-slate-500">
                  No se registraron problemas.
                </div>
                <div
                  v-for="issue in selectedDetail?.issues || []"
                  :key="issue.id"
                  class="border border-slate-100 rounded-2xl p-4"
                >
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-semibold text-slate-800">{{ issue.descripcion }}</p>
                    <UBadge :color="estadoColor(issue.severidad === 'CRITICO' ? 'CRITICO' : 'OBSERVADO')" variant="subtle" class="text-[9px] font-black uppercase">
                      {{ issue.severidad }}
                    </UBadge>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">Campo: {{ issue.campoId }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <UButton variant="ghost" color="neutral" @click="isDetailOpen = false">Cerrar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
