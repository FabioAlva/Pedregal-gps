<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { InspectionTemplate } from '#shared/types/db'
import { useInspectionTemplates } from '../../composables/useInspectionTemplates'
import InspectionTemplateModal from '../../components/InspectionTemplateModal.vue'

const search = ref('')
const isTemplateModalOpen = ref(false)
const selectedTemplate = ref<InspectionTemplate | null>(null)

const {
  templates,
  isLoading,
  isSaving,
  isUpdating,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = useInspectionTemplates()

onMounted(() => {
  fetchTemplates()
})

const filteredTemplates = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return templates.value
  return templates.value.filter(t =>
    t.nombre.toLowerCase().includes(q) ||
    (t.descripcion ?? '').toLowerCase().includes(q)
  )
})

const openCreateTemplate = () => {
  selectedTemplate.value = null
  isTemplateModalOpen.value = true
}

const openEditTemplate = (template: InspectionTemplate) => {
  selectedTemplate.value = template
  isTemplateModalOpen.value = true
}

const handleSaveTemplate = async (payload: any) => {
  const ok = selectedTemplate.value?.id
    ? await updateTemplate(selectedTemplate.value.id, payload)
    : await createTemplate(payload)

  if (ok) {
    isTemplateModalOpen.value = false
    selectedTemplate.value = null
  }
}

const handleDeleteTemplate = async (id: number) => {
  if (confirm('¿Eliminar esta plantilla?')) {
    await deleteTemplate(id)
  }
}
</script>

<template>
  <div class="w-full min-h-screen flex flex-col p-10 font-sans text-slate-900">
    <header class="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between mb-10">
      <div>
        <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Formatos DVIR</h1>
        <p class="text-sm text-slate-500 mt-3 max-w-2xl">
          Administra las plantillas activas y crea nuevas listas de chequeo.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 border border-slate-200 shadow-sm">
        <UInput v-model="search" variant="none" placeholder="Buscar plantilla..." icon="i-lucide-search" class="w-64 font-medium" />
        <div class="w-px h-8 bg-slate-100" />
        <UButton color="primary" icon="i-lucide-plus" class="px-6 font-bold" label="Nueva plantilla" @click="openCreateTemplate" />
      </div>
    </header>

    <div class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
      <div class="px-10 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Total: {{ filteredTemplates.length }} formatos
        </p>
        <div class="flex gap-2">
          <div class="w-1 h-1 bg-brand-500 rounded-none" />
          <div class="w-1 h-1 bg-slate-200 rounded-none" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-10 py-6 space-y-4">
        <div v-if="isLoading" class="text-sm text-slate-500">Cargando formatos...</div>
        <div v-else-if="filteredTemplates.length === 0" class="text-sm text-slate-500">Sin formatos por ahora.</div>

        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="border border-slate-100 rounded-2xl p-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">{{ template.nombre }}</h3>
              <p class="text-xs text-slate-500 mt-1">{{ template.descripcion || 'Sin descripcion' }}</p>
              <p class="text-[10px] text-slate-400 mt-2">
                {{ template.esquema?.length || 0 }} campos definidos
              </p>
              <UBadge
                v-if="!template.activo"
                color="neutral"
                variant="subtle"
                class="mt-3 text-[9px] font-black uppercase"
              >
                Inactiva
              </UBadge>
            </div>
            <div class="flex gap-2">
              <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" @click="openEditTemplate(template)" />
              <UButton icon="i-lucide-trash" variant="ghost" color="error" @click="handleDeleteTemplate(template.id)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <InspectionTemplateModal
      v-model="isTemplateModalOpen"
      :template="selectedTemplate"
      :saving="isSaving || isUpdating"
      @save="handleSaveTemplate"
    />
  </div>
</template>
