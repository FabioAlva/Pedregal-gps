<script setup lang="ts">
import { h, resolveComponent, ref, onMounted, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Assignment } from '../../../types/ITeemFleet'
import { UseTeemFleet } from '../../../composables/useTeamFeet'
import useFilter from '../../../composables/useFilter'
import { useFilterStore } from '../../../stores/useFilterStore'
import { parseLocalDateStr } from '../../../utils/FormatTime'
import { resolveRouteByPath, type FrontPermissionPayload } from '~/lib/route-permissions'

const {
  listGps, isloadingGps, fetchGps, listFleets, saveAssignment, availableGps,
  listAssignments, listActiveAssignments, isLoadingAssignments, fetchAssignments, fetchActiveAssignments, fetchFleets
} = UseTeemFleet()
const { refreshDevices } = useFilter()
const filterStore = useFilterStore()

const assignmentView = ref<'active' | 'all'>('active')
const toast = useToast()

const currentPagePermissions = ref<{ ver: boolean, agregar: boolean, editar: boolean, eliminar: boolean }>({
  ver: false,
  agregar: false,
  editar: false,
  eliminar: false
})

const canCreateAssignments = computed(() => currentPagePermissions.value.agregar)
const canEditAssignments = computed(() => currentPagePermissions.value.editar)

const loadCurrentPagePermissions = async () => {
  try {
    const [matchedRoute, permissions] = await Promise.all([
      resolveRouteByPath('/gps/team-fleet'),
      $fetch<FrontPermissionPayload>('/api/auth/mis-permisos')
    ])

    if (!matchedRoute?.id) return
    const flags = permissions.routes?.[matchedRoute.id]
    currentPagePermissions.value = {
      ver: flags?.ver === true,
      agregar: flags?.agregar === true,
      editar: flags?.editar === true,
      eliminar: flags?.eliminar === true
    }
  } catch {
    currentPagePermissions.value = { ver: false, agregar: false, editar: false, eliminar: false }
  }
}

const showPermissionDenied = (requiredAction: 'agregar' | 'editar') => {
  toast.add({
    title: 'Accion bloqueada por permisos',
    description: `Necesitas permiso ${requiredAction.toUpperCase()} en /gps/team-fleet para ejecutar esta accion.`,
    color: 'warning',
    icon: 'i-lucide-shield-alert'
  })
}

const assignmentSource = computed(() => {
  if (assignmentView.value === 'active') {
    return listActiveAssignments.value
  }

  return listAssignments.value
})

const sortedAssignments = computed(() => {
  return [...assignmentSource.value].sort((a, b) => {
    const aRet = a.fechaRetiro
    const bRet = b.fechaRetiro

    if (!aRet && bRet) return -1
    if (!bRet && aRet) return 1

    return 0
  })
})

const plateFilter = ref('')

const displayedAssignments = computed(() => {
  const plate = plateFilter.value.trim().toLowerCase()

  return sortedAssignments.value.filter((assignment) => {
    if (!plate) return true
    return assignment.placaAuto.toLowerCase().includes(plate)
  })
})

const refreshAssignments = async (options?: { force?: boolean }) => {
  const force = options?.force === true

  if (assignmentView.value === 'active') {
    await fetchActiveAssignments({ force })
    return
  }

  await fetchAssignments({ force })
}

onMounted(async () => {
  await Promise.all([fetchGps(), refreshAssignments(), fetchFleets(), loadCurrentPagePermissions()])
})

watch(assignmentView, async () => {
  await refreshAssignments({ force: true })
})

const isModalOpen = ref(false)
const form = ref({ flotaId: null, equipoId: null as number | null })

const openAssignModal = (gpsId: number) => {
  if (!canCreateAssignments.value) {
    showPermissionDenied('agregar')
    return
  }

  form.value.equipoId = gpsId
  isModalOpen.value = true
}

const isEditModalOpen = ref(false)
const selectedAssignment = ref<Assignment | null>(null)
const editFleetOptions = ref<{ id: number, placa: string }[]>([])

const openEditModal = async (row: Assignment) => {
  if (!canEditAssignments.value) {
    showPermissionDenied('editar')
    return
  }

  selectedAssignment.value = { ...row, fechaRetiro: row.fechaRetiro ?? null }
  editFleetOptions.value = await $fetch<{ id: number, placa: string }[]>('/api/fleets/available', {
    query: { includePlate: row.placaAuto }
  })
  isEditModalOpen.value = true
}

watch(isEditModalOpen, async (opened) => {
  if (!opened) {
    editFleetOptions.value = []
    await fetchFleets()
  }
})

const handleEditSave = async (data: Assignment) => {
  if (!canEditAssignments.value) {
    showPermissionDenied('editar')
    return
  }

  try {
    await $fetch(`/api/equipamentFeet/${data.idAsignacion}`, {
      method: 'PATCH',
      body: {
        ...(data.placaAuto && { flotaId: editFleetOptions.value.find((f) => f.placa === data.placaAuto)?.id }),
        ...(data.fechaAsignacion && { instaladoEl: data.fechaAsignacion })
      }
    })
    filterStore.invalidateDevices()
    await Promise.all([refreshAssignments({ force: true }), fetchFleets(undefined, { force: true }), refreshDevices()])
  } catch (err) { console.error(err) }
}

const finalizeAssignment = async (assignment: Assignment) => {
  if (!canEditAssignments.value) {
    showPermissionDenied('editar')
    return
  }

  try {
    await $fetch(`/api/equipamentFeet/${assignment.idAsignacion}`, {
      method: 'PATCH',
      body: { retiradoEl: new Date().toISOString() }
    })

    const gps = listGps.value.find((g) => g.value === assignment.idGps)
    if (gps?.id) {
      await $fetch(`/api/equipament/${gps.id}`, {
        method: 'PUT',
        body: { estadoId: 1 }
      })
    }

    filterStore.invalidateDevices()
    await Promise.all([
      refreshAssignments({ force: true }),
      fetchGps({ force: true }),
      fetchFleets(undefined, { force: true }),
      refreshDevices()
    ])
  } catch (err) {
    console.error(err)
  }
}

const handleSaveAssignment = async (payload: { flotaId: number; equipoId: number }) => {
  if (!canCreateAssignments.value) {
    showPermissionDenied('agregar')
    return
  }

  await saveAssignment(payload)
  await Promise.all([refreshAssignments({ force: true }), fetchFleets(undefined, { force: true }), refreshDevices()])
}

const UButton = resolveComponent('UButton')

const statusMap: Record<number, { label: string; dot: string; text: string; ping?: boolean }> = {
  1: { label: 'Sin asignar', dot: 'bg-gray-400', text: 'text-gray-400' },
  2: { label: 'Asignado', dot: 'bg-green-500', text: 'text-green-400', ping: true },
  3: { label: 'Fuera de servicio', dot: 'bg-red-500', text: 'text-red-400' }
}

const sorting = ref([{ id: 'idGps', desc: false }])

const columns: TableColumn<Assignment>[] = [
  { accessorKey: 'idGps', header: 'ID GPS' },
  { accessorKey: 'placaAuto', header: 'Placa' },
  { accessorKey: 'fechaAsignacion', header: 'Instalado', cell: ({ row }) => parseLocalDateStr(row.getValue('fechaAsignacion')) },
  { accessorKey: 'fechaRetiro', header: 'Retirado', cell: ({ row }) => parseLocalDateStr(row.getValue('fechaRetiro')) },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const assignment = row.original as Assignment
      const actions: ReturnType<typeof h>[] = []

      if (!assignment.fechaRetiro) {
        actions.push(
          h(UButton, {
            size: 'xs',
            color: 'primary',
            variant: 'soft',
            icon: 'i-lucide-pencil',
            label: 'Editar',
            class: 'border border-primary/20',
            disabled: !canEditAssignments.value,
            onClick: () => openEditModal(assignment)
          })
        )

        actions.push(
          h(UButton, {
            size: 'xs',
            color: 'danger',
            variant: 'soft',
            icon: 'i-lucide-link-2-off',
            label: 'Retirar',
            class: 'border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15',
            disabled: !canEditAssignments.value,
            onClick: () => finalizeAssignment(assignment)
          })
        )
      }

      return h('div', { class: 'flex items-center gap-2 justify-end' }, actions)
    }
  }
]


const assignedCount = computed(() => listGps.value.filter((g) => g.state === 2).length)
const unassignedCount = computed(() => listGps.value.filter((g) => g.state === 1).length)
const offlineCount = computed(() => listGps.value.filter((g) => g.state === 3).length)

</script>

<template>
  <div class="flex h-screen w-full bg-default overflow-hidden">
    
    <aside class="w-[270px] shrink-0 border-r border-default flex flex-col overflow-hidden">
      <div class="p-4 border-b border-default flex flex-col gap-2">
        <span class="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">Dispositivos GPS</span>
        <div class="flex gap-2">
          <span class="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold bg-green-500/15 text-green-500 border border-green-500/30">{{ assignedCount }} activos</span>
          <span class="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold bg-elevated text-muted border border-default">{{ unassignedCount }} libres</span>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
        <div v-if="isloadingGps" class="flex justify-center p-8 gap-2 text-xs text-muted">
          <div class="w-4 h-4 border-2 border-default border-t-primary rounded-full animate-spin" /> Cargando...
        </div>

        <div v-for="gps in listGps" v-else :key="gps.id" 
          :class="['p-3 rounded-lg border flex flex-col gap-2.5 bg-elevated transition-colors', 
            gps.state === 2 ? 'border-green-500/40 bg-green-500/5' : gps.state === 3 ? 'border-red-500/40 bg-red-500/5' : 'border-default']">
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span v-if="statusMap[gps.state]?.ping" class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span :class="['relative h-2 w-2 rounded-full', statusMap[gps.state]?.dot]" />
              </span>
              <span class="text-[0.85rem] font-bold text-highlighted">{{ gps.name }}</span>
            </div>
            <span :class="['text-[0.68rem] font-semibold tracking-wide', statusMap[gps.state]?.text]">{{ statusMap[gps.state]?.label }}</span>
          </div>
          
          <div class="flex flex-col gap-1.5 text-[0.7rem]">
            <div class="flex justify-between">
              <span class="text-muted">Código</span><span class="text-toned">{{ gps.value }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">IMEI</span><span class="font-mono">{{ gps.imei || '—' }}</span>
            </div>
            <div class="flex justify-between overflow-hidden">
              <span class="text-muted">Topic</span><span class="font-mono truncate ml-4">{{ gps.urlMqtt || '—' }}</span>
            </div>
          </div>

          <UButton v-if="gps.state === 1" size="xs" color="primary" variant="soft" label="Asignar vehículo" icon="i-lucide-link" block :disabled="!canCreateAssignments" @click="openAssignModal(Number(gps.id))" />
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="p-5 border-b border-default flex items-center justify-between shrink-0">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary block mb-1">Flota</span>
          <h1 class="text-xl font-extrabold text-highlighted m-0">Asignación GPS / Vehículo</h1>
        </div>
        <div class="flex gap-5 text-right">
          <div>
            <p class="text-[1.4rem] font-extrabold leading-none text-primary">{{ assignmentSource.length }}</p>
            <p class="text-[0.68rem] text-muted tracking-wide">Asignaciones</p>
          </div>
          <div>
            <p class="text-[1.4rem] font-extrabold leading-none text-green-500">{{ assignedCount }}</p>
            <p class="text-[0.68rem] text-muted tracking-wide">GPS activos</p>
          </div>
          <div>
            <p class="text-[1.4rem] font-extrabold leading-none text-red-500">{{ offlineCount }}</p>
            <p class="text-[0.68rem] text-muted tracking-wide">Fuera</p>
          </div>
        </div>
      </header>

      <div class="p-4 border-b border-default bg-default/50 shrink-0 flex items-center gap-3">
        <UInput v-model="plateFilter" class="max-w-xs" placeholder="Buscar por placa..." icon="i-lucide-search" />
        <USelect
          v-model="assignmentView"
          :items="[
            { label: 'Vigentes', value: 'active' },
            { label: 'Todas', value: 'all' }
          ]"
          value-key="value"
          label-key="label"
          class="w-40"
        />
      </div>

      <div class="flex-1 overflow-auto relative p-4">
        <div v-if="isLoadingAssignments" class="absolute inset-0 bg-default/80 z-10 flex items-center justify-center">
          <div class="w-8 h-8 border-3 border-default border-t-primary rounded-full animate-spin" />
        </div>
        <UTable v-model:sorting="sorting" :data="displayedAssignments" :columns="columns" class="w-full" />
      </div>
    </main>

    <AssignGpsModal v-model="isModalOpen" :fleets="listFleets" :gps-list="availableGps.map(g => ({ ...g, id: Number(g.id) }))" :initial-gps-id="form.equipoId ?? undefined" @save="handleSaveAssignment" />
    <EditAssignmentModal v-model="isEditModalOpen" :assignment="selectedAssignment" :fleets="editFleetOptions" @save="handleEditSave" />
  </div>
</template>

<style scoped>
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--ui-border) transparent; }
</style>