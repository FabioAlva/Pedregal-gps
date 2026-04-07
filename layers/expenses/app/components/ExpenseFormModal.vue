<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExpenseCategory, Fleet, FleetExpense } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  expense?: FleetExpense | null
  categories: ExpenseCategory[]
  fleets: Fleet[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: any): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = {
  flotaId: '',
  categoriaId: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: ''
}

const form = ref({ ...defaultForm })
const isHydrating = ref(false)

type FuelMetadataForm = {
  fuelEntryDate: string
  vendorName: string
  reference: string
  personal: boolean
  partialFuelUp: boolean
  resetUsage: boolean
  photos: string
  comments: string
}

type GenericMetadataForm = {
  vendorName: string
  reference: string
  details: string
  photos: string
  comments: string
}

const defaultFuelMeta = (): FuelMetadataForm => ({
  fuelEntryDate: '',
  vendorName: '',
  reference: '',
  personal: false,
  partialFuelUp: false,
  resetUsage: false,
  photos: '',
  comments: ''
})

const defaultGenericMeta = (): GenericMetadataForm => ({
  vendorName: '',
  reference: '',
  details: '',
  photos: '',
  comments: ''
})

const fuelMeta = ref<FuelMetadataForm>(defaultFuelMeta())
const genericMeta = ref<GenericMetadataForm>(defaultGenericMeta())
const fuelDocuments = ref('')
const genericDocuments = ref('')

const selectedCategory = computed(() => props.categories.find(c => String(c.id) === form.value.categoriaId))
const isFuelCategory = computed(() => selectedCategory.value?.esCombustible)

const parseList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)
const stringifyList = (value?: string[]) => (value ?? []).join(', ')

watch(
  () => props.expense,
  (expense) => {
    if (expense) {
      isHydrating.value = true
      form.value = {
        flotaId: String(expense.flotaId ?? ''),
        categoriaId: String(expense.categoriaId ?? ''),
        monto: expense.monto != null ? String(expense.monto) : '',
        fecha: expense.fecha ? new Date(expense.fecha).toISOString().slice(0, 10) : '',
        descripcion: expense.descripcion ?? ''
      }

      const metadata = (expense.metadatos ?? {}) as Record<string, any>
      const isFuel = props.categories.find(c => c.id === expense.categoriaId)?.esCombustible

      if (isFuel) {
        fuelMeta.value = {
          ...defaultFuelMeta(),
          fuelEntryDate: metadata.fuelEntryDate ?? '',
          vendorName: metadata.vendorName ?? '',
          reference: metadata.reference ?? '',
          personal: Boolean(metadata.flags?.personal),
          partialFuelUp: Boolean(metadata.flags?.partialFuelUp),
          resetUsage: Boolean(metadata.flags?.resetUsage),
          photos: stringifyList(metadata.photos),
          comments: metadata.comments ?? ''
        }
        fuelDocuments.value = stringifyList(expense.comprobantesUrl)
      } else {
        genericMeta.value = {
          ...defaultGenericMeta(),
          vendorName: metadata.vendorName ?? '',
          reference: metadata.reference ?? '',
          details: metadata.details ?? '',
          photos: stringifyList(metadata.photos),
          comments: metadata.comments ?? ''
        }
        genericDocuments.value = stringifyList(expense.comprobantesUrl)
      }
      isHydrating.value = false
    } else {
      form.value = { ...defaultForm }
      fuelMeta.value = defaultFuelMeta()
      genericMeta.value = defaultGenericMeta()
      fuelDocuments.value = ''
      genericDocuments.value = ''
    }
  },
  { immediate: true }
)

watch(
  () => form.value.categoriaId,
  (categoriaId) => {
    if (isHydrating.value) return
    if (!categoriaId) return
    fuelMeta.value = defaultFuelMeta()
    genericMeta.value = defaultGenericMeta()
    fuelDocuments.value = ''
    genericDocuments.value = ''
  }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  const isFuel = Boolean(isFuelCategory.value)
  const metadatos = isFuel
    ? {
      fuelEntryDate: fuelMeta.value.fuelEntryDate
        ? new Date(fuelMeta.value.fuelEntryDate).toISOString()
        : null,
      vendorName: fuelMeta.value.vendorName.trim() || null,
      reference: fuelMeta.value.reference.trim() || null,
      flags: {
        personal: fuelMeta.value.personal,
        partialFuelUp: fuelMeta.value.partialFuelUp,
        resetUsage: fuelMeta.value.resetUsage
      },
      photos: parseList(fuelMeta.value.photos),
      comments: fuelMeta.value.comments.trim() || null
    }
    : {
      vendorName: genericMeta.value.vendorName.trim() || null,
      reference: genericMeta.value.reference.trim() || null,
      details: genericMeta.value.details.trim() || null,
      photos: parseList(genericMeta.value.photos),
      comments: genericMeta.value.comments.trim() || null
    }

  const comprobantesUrl = parseList(isFuel ? fuelDocuments.value : genericDocuments.value)

  const payload: any = {
    flotaId: Number(form.value.flotaId),
    categoriaId: Number(form.value.categoriaId),
    monto: Number(form.value.monto),
    fecha: form.value.fecha ? new Date(form.value.fecha).toISOString() : null,
    descripcion: form.value.descripcion?.trim() || null,
    metadatos,
    comprobantesUrl
  }

  if (props.expense?.id) {
    payload.id = props.expense.id
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[620px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-receipt" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Gastos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ expense ? 'Editar gasto' : 'Nuevo gasto' }}</h3>
                <p class="text-xs text-slate-300">Registra costos asociados a cada unidad.</p>
              </div>
            </div>
            <UButton color="white" variant="ghost" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Unidad">
            <USelect
              v-model="form.flotaId"
              :items="fleets"
              value-key="id"
              label-key="placa"
              placeholder="Seleccionar unidad"
              icon="i-lucide-truck"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Categoria">
            <USelect
              v-model="form.categoriaId"
              :items="categories"
              value-key="id"
              label-key="nombre"
              placeholder="Seleccionar categoria"
              icon="i-lucide-tag"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Monto">
              <UInput v-model="form.monto" type="number" step="0.01" icon="i-lucide-dollar-sign" />
            </UFormField>
            <UFormField label="Fecha">
              <UInput v-model="form.fecha" type="date" icon="i-lucide-calendar" />
            </UFormField>
          </div>

          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Detalle del gasto" icon="i-lucide-notebook-pen" />
          </UFormField>

          <div v-if="isFuelCategory" class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-slate-500">Combustible</p>
              <p class="text-sm text-slate-600">Campos especiales para registro de carga.</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Fecha y hora de carga">
                <UInput v-model="fuelMeta.fuelEntryDate" type="datetime-local" icon="i-lucide-calendar-clock" />
              </UFormField>
              <UFormField label="Proveedor">
                <UInput v-model="fuelMeta.vendorName" placeholder="Nombre del grifo" icon="i-lucide-store" />
              </UFormField>
            </div>

            <UFormField label="Referencia">
              <UInput v-model="fuelMeta.reference" placeholder="Factura, transaccion, etc." icon="i-lucide-receipt" />
            </UFormField>

            <div class="grid grid-cols-3 gap-3">
              <UCheckbox v-model="fuelMeta.personal" label="Personal" />
              <UCheckbox v-model="fuelMeta.partialFuelUp" label="Carga parcial" />
              <UCheckbox v-model="fuelMeta.resetUsage" label="Reiniciar uso" />
            </div>

            <UFormField label="Fotos (URLs)">
              <UInput v-model="fuelMeta.photos" placeholder="https://..., https://..." icon="i-lucide-image" />
            </UFormField>

            <UFormField label="Documentos (URLs)">
              <UInput v-model="fuelDocuments" placeholder="https://..., https://..." icon="i-lucide-file-text" />
            </UFormField>

            <UFormField label="Comentarios">
              <UTextarea v-model="fuelMeta.comments" placeholder="Notas adicionales" />
            </UFormField>
          </div>

          <div v-else class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-slate-500">Detalles</p>
              <p class="text-sm text-slate-600">Campos opcionales segun el tipo de gasto.</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Proveedor">
                <UInput v-model="genericMeta.vendorName" placeholder="Nombre del proveedor" icon="i-lucide-store" />
              </UFormField>
              <UFormField label="Referencia">
                <UInput v-model="genericMeta.reference" placeholder="Factura, transaccion, etc." icon="i-lucide-receipt" />
              </UFormField>
            </div>

            <UFormField label="Detalles">
              <UTextarea v-model="genericMeta.details" placeholder="Descripcion del servicio o compra" />
            </UFormField>

            <UFormField label="Fotos (URLs)">
              <UInput v-model="genericMeta.photos" placeholder="https://..., https://..." icon="i-lucide-image" />
            </UFormField>

            <UFormField label="Documentos (URLs)">
              <UInput v-model="genericDocuments" placeholder="https://..., https://..." icon="i-lucide-file-text" />
            </UFormField>

            <UFormField label="Comentarios">
              <UTextarea v-model="genericMeta.comments" placeholder="Notas adicionales" />
            </UFormField>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="brand"
            :loading="saving"
            :disabled="!form.flotaId || !form.categoriaId || !form.monto"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ expense ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
