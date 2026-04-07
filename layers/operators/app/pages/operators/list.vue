<script setup lang="ts">
import { computed, h, onMounted, resolveComponent, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Operator } from '#shared/types/db'
import { useOperators } from '../../composables/useOperators'
import { useOperatorShifts } from '../../composables/useOperatorShifts'

const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

const search = ref('')
const { operators, isLoading, isSaving, fetchOperators, createOperator, updateOperator } = useOperators()
const { shifts, isLoading: isLoadingShifts, fetchShifts } = useOperatorShifts()

const isCreateOpen = ref(false)
const isDetailOpen = ref(false)
const isLicenseOpen = ref(false)
const selectedOperator = ref<Operator | null>(null)

const createForm = ref({
  nombres: '',
  apellidos: '',
  dni: '',
  telefono: ''
})

const licenseForm = ref({
  licencia: '',
  categoriaLicencia: '',
  vencimientoLicencia: ''
})

onMounted(() => {
  fetchOperators()
})

const rows = computed(() => operators.value.map(op => ({
  id: op.id,
  name: `${op.nombres} ${op.apellidos}`.trim(),
  phone: op.telefono || '-',
  doc: op.dni || '-',
  license: op.licencia || '-',
  category: op.categoriaLicencia || '-',
  status: op.activo ? 'Activo' : 'Inactivo',
  fotoUrl: op.fotoUrl || null
})))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row => (
    row.name.toLowerCase().includes(q) ||
    row.phone.includes(q) ||
    row.doc.toLowerCase().includes(q) ||
    row.license.toLowerCase().includes(q) ||
    row.category.toLowerCase().includes(q)
  ))
})

const columns: TableColumn<(typeof rows.value)[number]>[] = [
  {
    accessorKey: 'name',
    header: 'Operador',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-4' }, [
      row.original.fotoUrl
        ? h('img', {
            src: row.original.fotoUrl,
            class: 'w-12 h-12 rounded-none object-cover border border-slate-200 shadow-sm'
          })
        : h('div', {
            class: 'w-12 h-12 rounded-none bg-brand-50 text-brand-600 font-bold flex items-center justify-center border border-slate-200'
          }, row.original.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()),
      h('div', [
        h('p', { class: 'font-serif text-lg font-bold text-slate-950 leading-none' }, row.original.name),
        h('p', { class: 'text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1' }, `ID ${row.original.id}`)
      ])
    ])
  },
  {
    accessorKey: 'doc',
    header: 'Documento',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-semibold text-slate-600' }, row.original.doc)
  },
  {
    accessorKey: 'phone',
    header: 'Telefono',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.phone)
  },
  {
    accessorKey: 'license',
    header: 'Brevete',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.license)
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const map: Record<string, { color: string; label: string }> = {
        Activo: { color: 'success', label: 'Activo' },
        Inactivo: { color: 'neutral', label: 'Inactivo' }
      }
      const badge = map[row.original.status] ?? { color: 'neutral', label: row.original.status }
      return h(UBadge, { color: badge.color as any, variant: 'subtle', class: 'rounded-none px-3 font-black text-[9px] uppercase' }, () => badge.label)
    }
  }
]

const resetCreateForm = () => {
  createForm.value = { nombres: '', apellidos: '', dni: '', telefono: '' }
}

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const fromDateInput = (value: string) => (value ? new Date(value).toISOString() : null)

const openCreateModal = () => {
  resetCreateForm()
  isCreateOpen.value = true
}

const closeCreateModal = () => {
  isCreateOpen.value = false
}

const openDetailDrawer = (operator: Operator) => {
  selectedOperator.value = operator
  isDetailOpen.value = true
  if (!shifts.value.length) {
    fetchShifts()
  }
}

const closeDetailDrawer = () => {
  isDetailOpen.value = false
}

const openLicenseModal = () => {
  if (!selectedOperator.value) return
  licenseForm.value = {
    licencia: selectedOperator.value.licencia || '',
    categoriaLicencia: selectedOperator.value.categoriaLicencia || '',
    vencimientoLicencia: toDateInput(selectedOperator.value.vencimientoLicencia)
  }
  isLicenseOpen.value = true
}

const closeLicenseModal = () => {
  isLicenseOpen.value = false
}

const handleCreate = async () => {
  if (!createForm.value.nombres.trim() || !createForm.value.apellidos.trim()) return
  const ok = await createOperator({
    nombres: createForm.value.nombres.trim(),
    apellidos: createForm.value.apellidos.trim(),
    dni: createForm.value.dni.trim() || undefined,
    telefono: createForm.value.telefono.trim() || undefined
  })
  if (ok) {
    closeCreateModal()
    resetCreateForm()
  }
}

const handleSaveLicense = async () => {
  if (!selectedOperator.value) return
  if (!licenseForm.value.licencia.trim() || !licenseForm.value.categoriaLicencia.trim()) return
  const ok = await updateOperator(selectedOperator.value.id, {
    licencia: licenseForm.value.licencia.trim(),
    categoriaLicencia: licenseForm.value.categoriaLicencia.trim(),
    vencimientoLicencia: fromDateInput(licenseForm.value.vencimientoLicencia)
  })
  if (ok) {
    closeLicenseModal()
  }
}

const handleClearLicense = async () => {
  if (!selectedOperator.value) return
  await updateOperator(selectedOperator.value.id, {
    licencia: null,
    categoriaLicencia: null,
    vencimientoLicencia: null
  })
}

const handleRowSelect = (_event: Event, row: any) => {
  const operator = operators.value.find(op => op.id === row.original.id)
  if (operator) openDetailDrawer(operator)
}

const daysToExpire = (dateStr?: string | null) => {
  if (!dateStr) return null
  const now = new Date()
  const end = new Date(dateStr)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const licenseStatus = computed(() => {
  if (!selectedOperator.value?.vencimientoLicencia) return null
  const days = daysToExpire(selectedOperator.value.vencimientoLicencia)
  if (days === null) return null
  if (days <= 0) return { color: 'error', label: 'Vencido' }
  if (days <= 30) return { color: 'warning', label: `Vence en ${days}d` }
  return { color: 'success', label: 'Vigente' }
})

const activeTab = ref('profile')
const operatorTabs = [
  { id: 'profile', label: 'Perfil', icon: 'i-lucide-user' },
  { id: 'licenses', label: 'Licencias', icon: 'i-lucide-id-card' },
  { id: 'history', label: 'Asignaciones', icon: 'i-lucide-history' }
]

const licenseHistory = computed(() => {
  if (!selectedOperator.value?.licencia) return []
  return [
    {
      id: selectedOperator.value.id,
      licencia: selectedOperator.value.licencia,
      categoria: selectedOperator.value.categoriaLicencia || '-',
      vencimiento: selectedOperator.value.vencimientoLicencia
    }
  ]
})

const shiftHistory = computed(() => {
  if (!selectedOperator.value) return []
  return shifts.value.filter(shift => shift.operadorId === selectedOperator.value?.id)
})

watch(
  () => operators.value,
  (list) => {
    if (!selectedOperator.value) return
    const updated = list.find(op => op.id === selectedOperator.value?.id)
    if (updated) selectedOperator.value = updated
  },
  { deep: true }
)

watch(isDetailOpen, (open) => {
  if (open) activeTab.value = 'profile'
})
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-12">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Operadores</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Capital Humano</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Padron de Operadores</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar operador..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100 mx-3" />
        <UButton color="brand" icon="i-lucide-plus" class="px-6 font-bold" label="Nuevo Operador" @click="openCreateModal" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="filteredRows"
        :columns="columns"
        :loading="isLoading"
        :onSelect="handleRowSelect"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5',
          td: 'px-10 py-6 border-b border-slate-50 cursor-pointer font-sans',
          tr: 'hover:bg-slate-50/80 transition-all'
        }"
      />
    </div>

    <UModal v-model:open="isCreateOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
      <template #content>
        <div class="w-full max-w-[560px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
          <div class="bg-slate-950 p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <UIcon name="i-lucide-user-plus" class="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Operadores</span>
                  <h3 class="text-xl font-black tracking-tight mt-1">Nuevo Operador</h3>
                  <p class="text-xs text-slate-300">Registro de personal operativo.</p>
                </div>
              </div>
              <UButton icon="i-lucide-x" color="white" variant="ghost" @click="closeCreateModal" />
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Nombres">
                <UInput v-model="createForm.nombres" placeholder="Ej. Luis" />
              </UFormField>
              <UFormField label="Apellidos">
                <UInput v-model="createForm.apellidos" placeholder="Ej. Mendoza" />
              </UFormField>
              <UFormField label="DNI">
                <UInput v-model="createForm.dni" placeholder="00000000" />
              </UFormField>
              <UFormField label="Telefono">
                <UInput v-model="createForm.telefono" placeholder="999 999 999" />
              </UFormField>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="closeCreateModal">Cancelar</UButton>
            <UButton color="brand" :loading="isSaving" @click="handleCreate">Guardar</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <Transition name="drawer">
      <div v-if="isDetailOpen && selectedOperator" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="closeDetailDrawer" />

        <div class="relative w-full max-w-[75%] lg:max-w-[40%] h-full bg-white shadow-2xl flex flex-col">
          <div class="bg-slate-950 p-10 text-white shrink-0 relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full" />
            <div class="relative z-10 flex items-start justify-between">
              <div class="flex gap-6 items-center">
                <img
                  v-if="selectedOperator.fotoUrl"
                  :src="selectedOperator.fotoUrl"
                  class="w-24 h-24 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
                />
                <div>
                  <h3 class="text-3xl font-black tracking-tight">{{ selectedOperator.nombres }} {{ selectedOperator.apellidos }}</h3>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ selectedOperator.id }}</span>
                    <span class="text-slate-400 text-xs font-mono uppercase">{{ selectedOperator.dni || 'Sin documento' }}</span>
                  </div>
                </div>
              </div>
              <UButton icon="i-lucide-x" color="white" variant="ghost" size="xl" @click="closeDetailDrawer" />
            </div>
          </div>

          <div class="bg-white px-10 border-b border-slate-100 flex gap-8 shrink-0">
            <button
              v-for="tab in operatorTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative"
              :class="activeTab === tab.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-800'"
            >
              <span class="flex items-center gap-2">
                <UIcon :name="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
              </span>
              <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-1 bg-brand-500" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-10 space-y-8">
            <div v-if="activeTab === 'profile'" class="space-y-4">
              <h4 class="font-serif text-xl font-bold text-slate-900">Perfil</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-slate-400">Documento</p>
                  <p class="font-semibold text-slate-900">{{ selectedOperator.dni || '-' }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-slate-400">Telefono</p>
                  <p class="font-semibold text-slate-900">{{ selectedOperator.telefono || '-' }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-slate-400">Estado</p>
                  <UBadge :color="selectedOperator.activo ? 'success' : 'neutral'" variant="subtle" class="rounded-full px-3 font-black text-[9px] uppercase">
                    {{ selectedOperator.activo ? 'Activo' : 'Inactivo' }}
                  </UBadge>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-slate-400">Registro</p>
                  <p class="font-mono text-xs text-slate-700">{{ new Date(selectedOperator.createdAt).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'licenses'" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="font-serif text-xl font-bold text-slate-900">Licencias</h4>
                <UBadge v-if="licenseStatus" :color="licenseStatus.color" variant="subtle" class="rounded-full px-3 font-black text-[9px] uppercase">
                  {{ licenseStatus.label }}
                </UBadge>
              </div>

              <div v-if="!licenseHistory.length" class="text-center py-8 text-xs font-semibold text-slate-400">
                Sin licencias registradas.
              </div>

              <div v-else class="space-y-3">
                <div v-for="item in licenseHistory" :key="item.id" class="bg-white rounded-2xl border border-slate-200 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Licencia</p>
                      <p class="text-lg font-black text-slate-900 uppercase">{{ item.licencia }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Categoria</p>
                      <p class="text-sm font-bold text-slate-700">{{ item.categoria }}</p>
                    </div>
                  </div>
                  <p class="mt-3 text-xs font-mono text-slate-500">Vence: {{ item.vencimiento ? new Date(item.vencimiento).toLocaleDateString() : '-' }}</p>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'history'" class="space-y-4">
              <h4 class="font-serif text-xl font-bold text-slate-900">Historial de asignaciones</h4>

              <div v-if="isLoadingShifts" class="text-center py-8 text-xs font-semibold text-slate-400">
                Cargando asignaciones...
              </div>

              <div v-else-if="!shiftHistory.length" class="text-center py-8 text-xs font-semibold text-slate-400">
                Sin historial registrado.
              </div>

              <div v-else class="space-y-3">
                <div v-for="item in shiftHistory" :key="item.id" class="bg-white rounded-2xl border border-slate-200 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Unidad</p>
                      <p class="text-lg font-black text-slate-900 uppercase">{{ item.placa }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Periodo</p>
                      <p class="text-sm font-bold text-slate-700">
                        {{ new Date(item.fechaInicio).toLocaleDateString() }} - {{ item.fechaFin ? new Date(item.fechaFin).toLocaleDateString() : 'Actual' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <p class="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Acciones</p>
            <div class="flex gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                class="font-black text-[10px] uppercase tracking-widest rounded-xl px-5"
                @click="openLicenseModal"
              >
                {{ selectedOperator.licencia ? 'Renovar licencia' : 'Registrar licencia' }}
              </UButton>
              <UButton
                v-if="selectedOperator.licencia"
                color="error"
                variant="soft"
                class="font-black text-[10px] uppercase tracking-widest rounded-xl px-5"
                @click="handleClearLicense"
              >
                Eliminar licencia
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <UModal v-model:open="isLicenseOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
      <template #content>
        <div class="w-full max-w-[560px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
          <div class="bg-slate-950 p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <UIcon name="i-lucide-id-card" class="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Licencia</span>
                  <h3 class="text-xl font-black tracking-tight mt-1">Registro de Brevete</h3>
                  <p class="text-xs text-slate-300">Actualiza los datos de la licencia.</p>
                </div>
              </div>
              <UButton icon="i-lucide-x" color="white" variant="ghost" @click="closeLicenseModal" />
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Numero de licencia">
                <UInput v-model="licenseForm.licencia" placeholder="B123456" />
              </UFormField>
              <UFormField label="Categoria">
                <UInput v-model="licenseForm.categoriaLicencia" placeholder="A-IIb" />
              </UFormField>
              <UFormField label="Vencimiento">
                <UInput v-model="licenseForm.vencimientoLicencia" type="date" />
              </UFormField>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="closeLicenseModal">Cancelar</UButton>
            <UButton color="brand" :loading="isSaving" @click="handleSaveLicense">Guardar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>

<style scoped>
</style>
