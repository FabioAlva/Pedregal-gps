<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  route?: {
    id: number
    nombre: string
    url: string
    tipoRuta: 'frontend' | 'backend'
    metodo: string | null
    accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
    protegida: boolean
  } | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', payload: {
    id?: number
    nombre: string
    url: string
    tipoRuta: 'frontend' | 'backend'
    metodo: string | null
    accionRequerida: 'ver' | 'agregar' | 'editar' | 'eliminar' | null
    protegida: boolean
  }): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  nombre: '',
  url: '',
  tipoRuta: 'frontend' as 'frontend' | 'backend',
  metodo: undefined as string | undefined,
  accionRequerida: undefined as 'ver' | 'agregar' | 'editar' | 'eliminar' | undefined,
  protegida: true
})

watch(
  () => props.route,
  (route) => {
    if (!route) {
      form.value = {
        nombre: '',
        url: '',
        tipoRuta: 'frontend',
        metodo: undefined,
        accionRequerida: undefined,
        protegida: true
      }
      return
    }

    // CLONACIÓN LIMPIA: Rompemos la referencia con {...route}
    // Usamos el spread para copiar todo y luego sobreescribimos lo que necesite ajuste
    form.value = { 
      ...route, 
      metodo: route.metodo ?? undefined,
      accionRequerida: route.accionRequerida ?? undefined
    }
  },
  { immediate: true }
)

const confirmSave = () => {
  const isBackend = form.value.tipoRuta === 'backend'
  const payload = {
    id: props.route?.id,
    nombre: form.value.nombre.trim(),
    url: form.value.url.trim(),
    tipoRuta: form.value.tipoRuta,
    protegida: form.value.protegida,
    metodo: isBackend ? (form.value.metodo || null) : null,
    accionRequerida: isBackend ? (form.value.accionRequerida || null) : null
  }
  emit('save', payload)
}

const close = () => emit('update:modelValue', false)

</script>

<template>
  <UModal v-model:open="isOpen" :portal="true" :ui="{ content: 'p-0 bg-transparent' }">
    <template #content>
      <div class="w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div class="bg-slate-950 p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <UIcon name="i-lucide-route" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-brand-200">Rutas</span>
                <h3 class="text-xl font-black tracking-tight mt-1">{{ route ? 'Editar ruta' : 'Crear ruta' }}</h3>
                <p class="text-xs text-slate-300">Permisos y endpoints.</p>
              </div>
            </div>
            <UButton variant="ghost" color="white" icon="i-lucide-x" @click="close" />
          </div>
        </div>

        <div class="p-6 space-y-4">
          <UFormField label="Tipo de ruta">
            <USelect
              v-model="form.tipoRuta"
              :items="[
                { label: 'Frontend', value: 'frontend' },
                { label: 'Backend', value: 'backend' }
              ]"
            />
          </UFormField>

          <UFormField label="Patron de URL">
            <UInput v-model="form.url" placeholder="Ej: /gps/api" class="w-full" />
          </UFormField>

          <UFormField label="Nombre de la ruta">
            <UInput v-model="form.nombre" placeholder="Ej: API GPS" class="w-full" />
          </UFormField>

          <UFormField v-if="form.tipoRuta === 'backend'" label="Metodo HTTP">
            <USelect
              v-model="form.metodo"
              :items="[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'PATCH', value: 'PATCH' },
                { label: 'DELETE', value: 'DELETE' }
              ]"
            />
          </UFormField>

          <UFormField v-if="form.tipoRuta === 'backend'" label="Accion requerida">
            <USelect
              v-model="form.accionRequerida"
              :items="[
                { label: 'Ver', value: 'ver' },
                { label: 'Agregar', value: 'agregar' },
                { label: 'Editar', value: 'editar' },
                { label: 'Eliminar', value: 'eliminar' }
              ]"
            />
          </UFormField>

          <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input v-model="form.protegida" type="checkbox" class="h-4 w-4" />
            Ruta protegida
          </label>
        </div>

        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="close">Cancelar</UButton>
          <UButton
            color="brand"
            :loading="loading"
            :disabled="!form.url.trim()"
            @click="confirmSave"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
