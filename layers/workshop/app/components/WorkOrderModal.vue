<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Fleet, MaintenanceLog } from '#shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  workOrder?: MaintenanceLog | null
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

const toDateInput = (value?: string | Date | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const fromDateInput = (value: string) => (value ? new Date(value).toISOString() : null)

const defaultForm = {
  flotaId: '',
  realizadoPor: '',
  descripcion: '',
  kmAlRealizar: '',
  horasAlRealizar: '',
  fecha: ''
}

const form = ref({ ...defaultForm })

watch(
  () => props.workOrder,
  (order) => {
    if (order) {
      form.value = {
        flotaId: String(order.flotaId ?? ''),
        realizadoPor: order.realizadoPor ?? '',
        descripcion: order.descripcion ?? '',
        kmAlRealizar: order.kmAlRealizar != null ? String(order.kmAlRealizar) : '',
        horasAlRealizar: order.horasAlRealizar != null ? String(order.horasAlRealizar) : '',
        fecha: toDateInput(order.fecha ?? null)
      }
    } else {
      form.value = { ...defaultForm }
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  const payload: any = {
    flotaId: Number(form.value.flotaId),
    realizadoPor: form.value.realizadoPor?.trim() || null,
    descripcion: form.value.descripcion?.trim() || null,
    kmAlRealizar: form.value.kmAlRealizar ? Number(form.value.kmAlRealizar) : null,
    horasAlRealizar: form.value.horasAlRealizar ? Number(form.value.horasAlRealizar) : null,
    fecha: fromDateInput(form.value.fecha)
  }

  if (props.workOrder?.id) {
    payload.id = props.workOrder.id
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[680px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-wrench" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">Reparaciones</span>
                <h3 class="text-xl font-black tracking-tight mt-1">
                  {{ workOrder ? 'Editar orden' : 'Nueva orden' }}
                </h3>
                <p class="text-xs text-slate-300">Registra ordenes en taller.</p>
              </div>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="text-white" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Unidad">
            <USelect
              v-model="form.flotaId"
              :items="fleets"
              value-key="id"
              label-key="placa"
              placeholder="Selecciona unidad"
              icon="i-lucide-truck"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Responsable">
              <UInput v-model="form.realizadoPor" placeholder="Tecnico a cargo" icon="i-lucide-user" />
            </UFormField>
            <UFormField label="Fecha">
              <UInput v-model="form.fecha" type="date" icon="i-lucide-calendar" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Km al realizar">
              <UInput v-model="form.kmAlRealizar" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Horas al realizar">
              <UInput v-model="form.horasAlRealizar" type="number" placeholder="0" />
            </UFormField>
          </div>

          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Detalle de la orden" icon="i-lucide-notebook-pen" />
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.flotaId"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ workOrder ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
