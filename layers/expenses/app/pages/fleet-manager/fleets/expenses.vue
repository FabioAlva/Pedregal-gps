<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent, watch } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { FleetExpense } from '~~/shared/types/db'
import { useExpenses } from '../../../composables/useExpenses'
import { useExpenseCategories } from '../../../composables/useExpenseCategories'
import { useFleet } from '#layers/fleet-management/app/composable/useFleet'
import ExpenseDetailDrawer from '../../../components/ExpenseDetailDrawer.vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const search = ref('')
const isExpenseModalOpen = ref(false)
const isCategoryModalOpen = ref(false)
const selectedExpense = ref<FleetExpense | null>(null)
const selectedExpenseDetail = ref<FleetExpense | null>(null)

const isExpenseDrawerOpen = computed({
  get: () => !!selectedExpenseDetail.value,
  set: (val) => {
    if (!val) selectedExpenseDetail.value = null
  }
})

const {
  expenses,
  isLoading,
  isSaving,
  isUpdating,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} = useExpenses()

const {
  categories,
  isLoading: isLoadingCategories,
  isSaving: isSavingCategory,
  isUpdating: isUpdatingCategory,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = useExpenseCategories()

const { fleets, fetchFleets } = useFleet()

onMounted(() => {
  fetchExpenses()
  fetchCategories()
  fetchFleets()
})

const categoryMap = computed(() => new Map(categories.value.map(c => [c.id, c])))
const fleetMap = computed(() => new Map(fleets.value.map(f => [f.id, f])))

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-PE')
}

const formatAmount = (value?: number | null) => {
  if (value == null) return '-'
  return `S/ ${Number(value).toFixed(2)}`
}

const rows = computed(() => expenses.value.map(expense => {
  const categoria = categoryMap.value.get(expense.categoriaId)
  const flota = fleetMap.value.get(expense.flotaId)
  return {
    ...expense,
    categoria,
    categoriaNombre: categoria?.nombre ?? 'Sin categoria',
    flotaPlaca: flota?.placa ?? 'Sin placa'
  }
}))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    row.categoriaNombre.toLowerCase().includes(q) ||
    row.flotaPlaca.toLowerCase().includes(q) ||
    String(row.monto).includes(q) ||
    (row.descripcion ?? '').toLowerCase().includes(q)
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

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, formatDate(row.original.fecha))
  },
  {
    accessorKey: 'flotaPlaca',
    header: 'Unidad',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold text-slate-600' }, row.original.flotaPlaca)
  },
  {
    accessorKey: 'categoriaNombre',
    header: 'Categoria',
    cell: ({ row }) => {
      const isFuel = row.original.categoria?.esCombustible
      return h(UBadge, {
        color: isFuel ? 'warning' : 'neutral',
        variant: 'subtle',
        class: 'rounded-none px-3 font-black text-[9px] uppercase'
      }, () => row.original.categoriaNombre)
    }
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs font-black text-slate-700' }, formatAmount(row.original.monto))
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripcion',
    cell: ({ row }) => h('span', { class: 'text-xs font-medium text-slate-500' }, row.original.descripcion ?? '-')
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        color: 'neutral',
        onClick: (event: Event) => { event.stopPropagation(); openEditExpense(row.original) }
      }),
      h(UButton, {
        icon: 'i-lucide-trash',
        variant: 'ghost',
        color: 'error',
        onClick: (event: Event) => { event.stopPropagation(); handleDeleteExpense(row.original.id) }
      })
    ])
  }
]

const onSelectRow = (_event: Event, row: TableRow<any>) => {
  selectedExpenseDetail.value = row.original
}

const openCreateExpense = () => {
  selectedExpense.value = null
  isExpenseModalOpen.value = true
}

const openEditExpense = (expense: FleetExpense) => {
  selectedExpense.value = expense
  isExpenseModalOpen.value = true
}

const openEditFromDrawer = () => {
  if (!selectedExpenseDetail.value) return
  selectedExpense.value = selectedExpenseDetail.value
  isExpenseModalOpen.value = true
  selectedExpenseDetail.value = null
}

const handleSaveExpense = async (payload: any) => {
  const ok = payload?.id
    ? await updateExpense(payload.id, payload)
    : await createExpense(payload)

  if (ok) {
    isExpenseModalOpen.value = false
    selectedExpense.value = null
  }
}

const handleDeleteExpense = async (id: number) => {
  if (confirm('¿Eliminar este gasto?')) {
    await deleteExpense(id)
  }
}

const handleDeleteFromDrawer = async () => {
  if (!selectedExpenseDetail.value) return
  await handleDeleteExpense(selectedExpenseDetail.value.id)
  selectedExpenseDetail.value = null
}

const handleCreateCategory = async (payload: any) => {
  await createCategory(payload)
}

const handleUpdateCategory = async (id: number, payload: any) => {
  await updateCategory(id, payload)
}

const handleDeleteCategory = async (id: number) => {
  if (confirm('¿Eliminar esta categoria?')) {
    await deleteCategory(id)
  }
}
</script>

<template>
  <div class="w-full h-screen flex flex-col p-10 font-sans text-slate-900 overflow-hidden">
    <header class="flex items-center justify-between mb-12">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Gastos</h1>
          <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            <span>Flota Agricola</span>
            <UIcon name="i-lucide-chevron-right" class="w-3 h-3 opacity-30" />
            <span class="text-slate-600">Gastos Asociados</span>
          </nav>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20">
        <UInput v-model="search" variant="none" placeholder="Buscar gasto..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100" />
        <UButton color="slate" variant="subtle" icon="i-lucide-tags" class="px-5 font-bold" label="Categorias" @click="isCategoryModalOpen = true" />
        <UButton color="brand" icon="i-lucide-plus" class="px-6 font-bold bg-primary text-white" label="Nuevo gasto" @click="openCreateExpense" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <UTable
        :data="pagedRows"
        :columns="columns"
        :loading="isLoading || isLoadingCategories"
        @select="onSelectRow"
        class="flex-1"
        :ui="{
          thead: 'bg-slate-50/50',
          th: 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-10 py-5',
          td: 'px-10 py-6 border-b border-slate-50 font-sans cursor-pointer',
          tr: 'hover:bg-slate-50/80 transition-all'
        }"
      />

      <div class="px-10 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ totalRows }} gastos registrados
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

    <ExpenseFormModal
      v-model="isExpenseModalOpen"
      :expense="selectedExpense"
      :saving="isSaving || isUpdating"
      :categories="categories"
      :fleets="fleets"
      @save="handleSaveExpense"
    />

    <ExpenseCategoryModal
      v-model="isCategoryModalOpen"
      :categories="categories"
      :saving="isSavingCategory"
      :updating="isUpdatingCategory"
      @create="handleCreateCategory"
      @update="handleUpdateCategory"
      @delete="handleDeleteCategory"
    />

    <ExpenseDetailDrawer
      v-model="isExpenseDrawerOpen"
      :expense="selectedExpenseDetail"
      :categories="categories"
      :fleets="fleets"
      @edit="openEditFromDrawer"
      @delete="handleDeleteFromDrawer"
    />
  </div>
</template>
