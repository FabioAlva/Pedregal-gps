<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { InspectionTemplate } from '#shared/types/db'
import { useInspectionTemplates } from '../../composables/useInspectionTemplates'
import { useInspections } from '../../composables/useInspections'
import { useFleet } from '#layers/fleet-management/app/composable/useFleet'
import { useOperators } from '#layers/operators/app/composables/useOperators'
import InspectionTemplateModal from '../../components/InspectionTemplateModal.vue'

const toast = useToast()

const isTemplateModalOpen = ref(false)
const selectedTemplate = ref<InspectionTemplate | null>(null)

const selectedTemplateId = ref('')
const selectedFleetId = ref('')
const selectedOperatorId = ref('')
const inspectionType = ref<'PRE_USO' | 'POST_USO' | 'PERIODICA'>('PRE_USO')
const observaciones = ref('')
const responses = ref<Record<string, any>>({})

const {
  templates,
  isSaving: isSavingTemplate,
  isUpdating: isUpdatingTemplate,
  fetchTemplates,
  createTemplate,
  updateTemplate
} = useInspectionTemplates()

const { createInspection, isSaving: isSavingInspection } = useInspections()
const { fleets, fetchFleets } = useFleet()
const { operators, fetchOperators } = useOperators()

onMounted(() => {
  fetchTemplates()
  fetchFleets()
  fetchOperators()
})

const activeTemplates = computed(() => templates.value.filter(t => t.activo))


const selectedTemplateObj = computed(() => {
  return templates.value.find(t => String(t.id) === selectedTemplateId.value) ?? null
})

const fleetOptions = computed(() => fleets.value.map(f => ({
  label: f.placa ?? `Unidad ${f.id}`,
  value: String(f.id)
})))

const operatorOptions = computed(() => operators.value.map(o => ({
  label: `${o.nombres} ${o.apellidos}`.trim(),
  value: String(o.id)
})))

const templateOptions = computed(() => activeTemplates.value.map(t => ({
  label: t.nombre,
  value: String(t.id)
})))

const setDefaultsFromTemplate = (template: InspectionTemplate | null) => {
  if (!template) {
    responses.value = {}
    return
  }

  const defaults: Record<string, any> = {}
  for (const field of template.esquema ?? []) {
    if (field.tipo === 'boolean') {
      defaults[field.id] = { value: true, nota: '' }
    } else if (field.tipo === 'numero') {
      defaults[field.id] = null
    } else if (field.tipo === 'seleccion') {
      defaults[field.id] = field.opciones?.[0] ?? ''
    } else {
      defaults[field.id] = ''
    }
  }
  responses.value = defaults
}

watch(selectedTemplateObj, (template) => setDefaultsFromTemplate(template), { immediate: true })

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

const buildIssues = (template: InspectionTemplate, respuestas: Record<string, any>) => {
  const issues: any[] = []

  for (const field of template.esquema ?? []) {
    const value = respuestas[field.id]

    if (field.tipo === 'boolean') {
      const flag = value?.value
      if (field.alertaSi && flag === false) {
        issues.push({
          campoId: field.id,
          descripcion: value?.nota?.trim() || `Problema en ${field.label}`,
          severidad: 'CRITICO'
        })
      }
      continue
    }

    if (field.requerido && (value === null || value === undefined || value === '')) {
      issues.push({
        campoId: field.id,
        descripcion: `Campo requerido sin completar: ${field.label}`,
        severidad: 'MODERADO'
      })
    }
  }

  return issues
}

const resolveEstado = (issues: Array<{ severidad: string }>) => {
  if (issues.some(issue => issue.severidad === 'CRITICO')) return 'CRITICO'
  if (issues.length > 0) return 'OBSERVADO'
  return 'APROBADO'
}

const resetForm = () => {
  selectedFleetId.value = ''
  selectedOperatorId.value = ''
  inspectionType.value = 'PRE_USO'
  observaciones.value = ''
  setDefaultsFromTemplate(selectedTemplateObj.value)
}

const submitInspection = async () => {
  if (!selectedTemplateObj.value) {
    toast.add({ title: 'Falta plantilla', description: 'Selecciona una plantilla', color: 'error' })
    return
  }

  if (!selectedFleetId.value) {
    toast.add({ title: 'Falta unidad', description: 'Selecciona una unidad', color: 'error' })
    return
  }

  const issues = buildIssues(selectedTemplateObj.value, responses.value)
  const estado = resolveEstado(issues)

  const payload = {
    flotaId: Number(selectedFleetId.value),
    operadorId: selectedOperatorId.value ? Number(selectedOperatorId.value) : null,
    plantillaId: selectedTemplateObj.value.id,
    esquemaSnapshot: selectedTemplateObj.value.esquema,
    respuestas: responses.value,
    estado,
    tipo: inspectionType.value,
    observaciones: observaciones.value?.trim() || null,
    issues
  }

  const ok = await createInspection(payload as any)
  if (ok) {
    resetForm()
  }
}
</script>

<template>
  <div class="w-full min-h-screen flex flex-col p-10 font-sans text-slate-900">
    <header class="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between mb-10">
      <div>
        <h1 class="font-serif text-5xl font-bold tracking-tighter text-slate-950 leading-none">Inspecciones DVIR</h1>
        <p class="text-sm text-slate-500 mt-3 max-w-2xl">
          Selecciona una plantilla, completa el checklist y registra la inspeccion diaria.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          to="/inspections/templates"
          color="neutral"
          variant="ghost"
          icon="i-lucide-folder-open"
          class="px-5 font-bold"
          label="Ver formatos"
        />
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="px-6 font-bold"
          label="Nueva plantilla"
          @click="openCreateTemplate"
        />
      </div>
    </header>

    <div class="grid grid-cols-1 gap-8">
      <section class="bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-3xl p-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900">Checklist diario</h2>
            <p class="text-xs text-slate-500">Completa la revision para la unidad seleccionada.</p>
          </div>
          <UBadge color="neutral" variant="subtle" class="text-[10px] font-black uppercase">
            {{ selectedTemplateObj ? selectedTemplateObj.nombre : 'Sin plantilla' }}
          </UBadge>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UFormField label="Unidad">
            <USelect v-model="selectedFleetId" :items="fleetOptions" placeholder="Selecciona unidad" />
          </UFormField>
          <UFormField label="Operador">
            <USelect v-model="selectedOperatorId" :items="operatorOptions" placeholder="Selecciona operador" />
          </UFormField>
          <UFormField label="Tipo">
            <USelect
              v-model="inspectionType"
              :items="[
                { label: 'Pre uso', value: 'PRE_USO' },
                { label: 'Post uso', value: 'POST_USO' },
                { label: 'Periodica', value: 'PERIODICA' }
              ]"
            />
          </UFormField>
        </div>

        <UFormField label="Plantilla">
          <USelect v-model="selectedTemplateId" :items="templateOptions" placeholder="Selecciona plantilla" />
        </UFormField>

        <div class="mt-6 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
          <div v-if="selectedTemplateObj" class="space-y-4">
            <div
              v-for="field in selectedTemplateObj.esquema"
              :key="field.id"
              class="border border-slate-100 rounded-2xl p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ field.label }}</p>
                  <p class="text-[11px] text-slate-400">
                    {{ field.tipo === 'boolean' ? 'Si / No' : field.tipo }}
                  </p>
                </div>
                <UBadge v-if="field.requerido" color="warning" variant="subtle" class="text-[9px] font-black uppercase">
                  Requerido
                </UBadge>
              </div>

              <div class="mt-3">
                <UCheckbox
                  v-if="field.tipo === 'boolean'"
                  v-model="responses[field.id].value"
                  label="OK"
                />

                <UInput
                  v-else-if="field.tipo === 'texto'"
                  v-model="responses[field.id]"
                  placeholder="Detalle"
                />

                <UInput
                  v-else-if="field.tipo === 'numero'"
                  v-model="responses[field.id]"
                  type="number"
                  step="0.01"
                  placeholder="0"
                />

                <USelect
                  v-else-if="field.tipo === 'seleccion'"
                  v-model="responses[field.id]"
                  :items="(field.opciones || []).map(op => ({ label: op, value: op }))"
                  placeholder="Selecciona"
                />

                <UInput
                  v-else-if="field.tipo === 'foto'"
                  v-model="responses[field.id]"
                  placeholder="URL de foto"
                />
              </div>

              <div v-if="field.tipo === 'boolean' && responses[field.id]?.value === false" class="mt-3">
                <UFormField label="Observacion">
                  <UInput v-model="responses[field.id].nota" placeholder="Describe el problema" />
                </UFormField>
              </div>
            </div>
          </div>

          <UFormField label="Observaciones generales">
            <UTextarea v-model="observaciones" placeholder="Notas generales de la inspeccion" />
          </UFormField>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="resetForm">Limpiar</UButton>
          <UButton
            color="primary"
            :loading="isSavingInspection"
            :disabled="!selectedTemplateObj || !selectedFleetId"
            class="font-bold px-6"
            @click="submitInspection"
          >
            Guardar inspeccion
          </UButton>
        </div>
      </section>

    </div>

    <InspectionTemplateModal
      v-model="isTemplateModalOpen"
      :template="selectedTemplate"
      :saving="isSavingTemplate || isUpdatingTemplate"
      @save="handleSaveTemplate"
    />
  </div>
</template>
