<script setup lang="ts">
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
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" @click="close" />

    <UCard class="relative w-full max-w-lg shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">
            {{ route ? 'Editar ruta' : 'Crear ruta' }}
          </h3>
          <UButton variant="ghost" icon="i-lucide-x" @click="close" />
        </div>
      </template>

      <div class="space-y-4 py-2">
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

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            :loading="loading"
            :disabled="!form.url.trim()"
            @click="confirmSave"
          >
            Guardar
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
