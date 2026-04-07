<script setup lang="ts">
import { computed } from 'vue'
import type { ExpenseCategory, Fleet, FleetExpense } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  expense: FleetExpense | null
  categories: ExpenseCategory[]
  fleets: Fleet[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'edit'): void
  (event: 'delete'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const category = computed(() => props.categories.find(c => c.id === props.expense?.categoriaId))
const fleet = computed(() => props.fleets.find(f => f.id === props.expense?.flotaId))

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
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen && expense" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" @click="isOpen = false" />

      <div class="relative w-full max-w-[75%] lg:max-w-[40%] h-full bg-white shadow-2xl flex flex-col">
        <div class="bg-slate-950 p-10 text-white shrink-0 relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full" />

          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h2 class="font-sans text-4xl font-black leading-none tracking-tighter">
                {{ category?.nombre || 'Sin categoria' }}
              </h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="px-2 py-0.5 bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">ID {{ expense.id }}</span>
                <span class="text-slate-400 text-xs font-mono uppercase">{{ fleet?.placa || 'Sin unidad' }}</span>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="white" variant="ghost" size="xl" @click="isOpen = false" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
          <div class="space-y-6">
            <h3 class="font-serif text-xl font-bold text-slate-900">Resumen</h3>
            <div class="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
              <div class="flex justify-between p-5 border-b border-slate-50">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                <span class="text-sm font-bold text-slate-800 uppercase">{{ formatDate(expense.fecha) }}</span>
              </div>
              <div class="flex justify-between p-5 border-b border-slate-50">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</span>
                <span class="text-sm font-bold text-slate-800 uppercase">{{ formatAmount(expense.monto) }}</span>
              </div>
              <div class="flex justify-between p-5 border-b border-slate-50">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</span>
                <span class="text-sm font-bold text-slate-800 uppercase">{{ fleet?.placa || 'Sin unidad' }}</span>
              </div>
              <div class="flex justify-between p-5">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</span>
                <span class="text-sm font-bold text-slate-800 uppercase">{{ category?.nombre || 'Sin categoria' }}</span>
              </div>
            </div>

            <div class="space-y-2">
              <h3 class="font-serif text-xl font-bold text-slate-900">Descripcion</h3>
              <div class="bg-white rounded-2xl border border-slate-200/60 p-5 text-sm text-slate-600">
                {{ expense.descripcion || 'Sin descripcion' }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="emit('edit')">Editar</UButton>
          <UButton color="error" variant="soft" @click="emit('delete')">Eliminar</UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e1261c; }
</style>
