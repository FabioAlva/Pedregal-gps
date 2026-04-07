<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Fleet, MaintenanceSchedule } from '#shared/types/db'

const props = defineProps<{
  modelValue: boolean
  saving?: boolean
  schedule?: MaintenanceSchedule | null
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
  nombre: '',
  descripcion: '',
  intervaloKm: '',
  intervaloHoras: '',
  intervaloDias: '',
  ultimoKm: '',
  ultimasHoras: '',
  ultimaFecha: '',
  activo: true
}

const form = ref({ ...defaultForm })

watch(
  () => props.schedule,
  (schedule) => {
    if (schedule) {
      form.value = {
        flotaId: String(schedule.flotaId ?? ''),
        nombre: schedule.nombre ?? '',
        descripcion: schedule.descripcion ?? '',
        intervaloKm: schedule.intervaloKm != null ? String(schedule.intervaloKm) : '',
        intervaloHoras: schedule.intervaloHoras != null ? String(schedule.intervaloHoras) : '',
        intervaloDias: schedule.intervaloDias != null ? String(schedule.intervaloDias) : '',
        ultimoKm: schedule.ultimoKm != null ? String(schedule.ultimoKm) : '',
        ultimasHoras: schedule.ultimasHoras != null ? String(schedule.ultimasHoras) : '',
        ultimaFecha: toDateInput(schedule.ultimaFecha ?? null),
        activo: schedule.activo ?? true
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
    nombre: form.value.nombre.trim(),
    descripcion: form.value.descripcion?.trim() || null,
    intervaloKm: form.value.intervaloKm ? Number(form.value.intervaloKm) : null,
    intervaloHoras: form.value.intervaloHoras ? Number(form.value.intervaloHoras) : null,
    intervaloDias: form.value.intervaloDias ? Number(form.value.intervaloDias) : null,
    ultimoKm: form.value.ultimoKm ? Number(form.value.ultimoKm) : null,
    ultimasHoras: form.value.ultimasHoras ? Number(form.value.ultimasHoras) : null,
    ultimaFecha: fromDateInput(form.value.ultimaFecha),
    activo: form.value.activo
  }

  if (props.schedule?.id) {
    payload.id = props.schedule.id
  }

  emit('save', payload)
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-[760px] bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-calendar-check" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">Mantenimientos</span>
                <h3 class="text-xl font-black tracking-tight mt-1">
                  {{ schedule ? 'Editar mantenimiento' : 'Nuevo mantenimiento' }}
                </h3>
                <p class="text-xs text-slate-300">Programa servicios preventivos para la flota.</p>
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
            <UFormField label="Nombre">
              <UInput v-model="form.nombre" placeholder="Cambio de aceite" icon="i-lucide-wrench" />
            </UFormField>
            <UFormField label="Estado">
              <USelect
                v-model="form.activo"
                :items="[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }]"
              />
            </UFormField>
          </div>

          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Notas generales" icon="i-lucide-notebook-pen" />
          </UFormField>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Intervalo Km">
              <UInput v-model="form.intervaloKm" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Intervalo Horas">
              <UInput v-model="form.intervaloHoras" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Intervalo Dias">
              <UInput v-model="form.intervaloDias" type="number" placeholder="0" />
            </UFormField>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <UFormField label="Ultimo Km">
              <UInput v-model="form.ultimoKm" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Ultimas Horas">
              <UInput v-model="form.ultimasHoras" type="number" placeholder="0" />
            </UFormField>
            <UFormField label="Ultima Fecha">
              <UInput v-model="form.ultimaFecha" type="date" />
            </UFormField>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="saving"
            :disabled="!form.flotaId || !form.nombre.trim()"
            class="font-bold px-6"
            @click="confirm"
          >
            {{ schedule ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
