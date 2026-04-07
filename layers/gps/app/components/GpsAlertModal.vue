<script setup lang="ts">
import { computed } from 'vue'
import type { GpsAlert } from '~~/shared/types/db'

const props = defineProps<{
  modelValue: boolean
  alert: GpsAlert | null
  saving?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  descripcion: '',
  limiteValor: 0,
  activo: true
})

watch(
  () => props.alert,
  (alert) => {
    if (!alert) {
      form.value = { descripcion: '', limiteValor: 0, activo: true }
      return
    }

    form.value = {
      descripcion: alert.descripcion,
      limiteValor: alert.limiteValor,
      activo: alert.activo
    }
  },
  { immediate: true }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('save', { ...form.value, id: props.alert?.id })
  close()
}
</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-bell-ring" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Alertas</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ alert ? 'Editar alerta' : 'Nueva alerta' }}</h3>
                <p class="text-xs text-slate-300">Gestion de alertas GPS.</p>
              </div>
            </div>
            <UButton variant="ghost" color="white" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Descripcion">
            <UInput v-model="form.descripcion" placeholder="Ej: Limite velocidad" class="w-full" />
          </UFormField>

          <UFormField label="Limite de valor">
            <UInput v-model="form.limiteValor" type="number" class="w-full" />
          </UFormField>

          <UFormField label="Activo">
            <div class="flex items-center gap-2">
              <input
                id="activo"
                type="checkbox"
                class="h-4 w-4 rounded border-default text-primary focus:ring-primary"
                v-model="form.activo"
              />
              <label for="activo" class="text-sm text-muted">Habilitar alerta</label>
            </div>
          </UFormField>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton :loading="saving" color="brand" :disabled="!form.descripcion || form.limiteValor <= 0" @click="confirm">
            Guardar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
