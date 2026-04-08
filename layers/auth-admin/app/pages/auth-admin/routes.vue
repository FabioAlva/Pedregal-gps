<script setup lang="ts">
definePageMeta({ layout: "admin-layout" });

// 1. Store y Funciones
const {
  moduleStore,
  selectedModuleRouteId,
  relatedRouteIdsDraft,
  isSavingRelated,
  isSavingNewRoute,
  isUpdatingRoute,
  loadRoutes,
  loadRelatedRoutes,
  saveRelatedRoutes,
  createRoute,
  updateRoute,
} = useRoutesManager();

// 2. Estados UI
const q = ref("");
const qFrontend = ref("");
const activeTab = ref("all");
const isModalOpen = ref(false);
const selectedRouteToEdit = ref<any>(null);

const tabs = [
  { label: "Todos", value: "all" },
  { label: "Ver", value: "ver" },
  { label: "Agregar", value: "agregar" },
  { label: "Editar", value: "editar" },
  { label: "Eliminar", value: "eliminar" },
];

// --- LÓGICA DE FILTRADO ---
const frontendRoutes = computed(() => {
  const term = qFrontend.value.toLowerCase().trim();
  const base = moduleStore.routes.filter((r) => r.tipoRuta === "frontend");
  if (!term) return base;
  return base.filter((r) => r.url.toLowerCase().includes(term) || r.nombre.toLowerCase().includes(term));
});

const backendRoutes = computed(() => {
  return moduleStore.routes.filter((r) => r.tipoRuta === "backend" && r.protegida);
});

const filteredBackend = computed(() => {
  const term = q.value.toLowerCase().trim();
  return backendRoutes.value.filter((r) => {
    const matchesSearch = r.url.toLowerCase().includes(term) || r.nombre.toLowerCase().includes(term);
    const action = getActionByMethod(r);
    const isRelated = relatedRouteIdsDraft.value.has(r.id);
    if (activeTab.value === "all") return matchesSearch;
    return matchesSearch && action === activeTab.value && isRelated;
  });
});

// --- PAGINACIÓN ---
const frontendPage = ref(1);
const frontendItemsPerPage = 6;
const backendPage = ref(1);
const backendItemsPerPage = 10;

const paginatedFrontend = computed(() => {
  const start = (frontendPage.value - 1) * frontendItemsPerPage;
  return frontendRoutes.value.slice(Math.max(0, start), start + frontendItemsPerPage);
});

const paginatedBackend = computed(() => {
  const start = (backendPage.value - 1) * backendItemsPerPage;
  return filteredBackend.value.slice(Math.max(0, start), start + backendItemsPerPage);
});

// --- UTILIDADES ---
const getActionByMethod = (api: any) => {
  if (api.accionRequerida) return api.accionRequerida;
  const method = api.metodo?.toUpperCase();
  if (method === "POST") return "agregar";
  if (["PUT", "PATCH"].includes(method)) return "editar";
  if (method === "DELETE") return "eliminar";
  return "ver";
};

const getCount = (tabValue: string) => {
  if (tabValue === "all") return backendRoutes.value.length;
  return backendRoutes.value.filter((r) => getActionByMethod(r) === tabValue && relatedRouteIdsDraft.value.has(r.id)).length;
};

const toggleRelation = (id: number) => {
  const next = new Set(relatedRouteIdsDraft.value);
  next.has(id) ? next.delete(id) : next.add(id);
  relatedRouteIdsDraft.value = next;
};

const openCreate = () => {
  selectedRouteToEdit.value = null;
  isModalOpen.value = true;
};

const openEdit = (route: any) => {
  selectedRouteToEdit.value = route;
  isModalOpen.value = true;
};

const handleSave = async (payload: any) => {
  const isNew = !payload.id;
  const result = isNew ? await createRoute(payload) : await updateRoute(payload.id, payload);
  if (result) {
    isModalOpen.value = false;
    if (isNew) {
      await nextTick();
      frontendPage.value = Math.ceil(frontendRoutes.value.length / frontendItemsPerPage);
    }
  }
};

watch(qFrontend, () => { frontendPage.value = 1; });
watch([q, activeTab], () => { backendPage.value = 1; });
watch(selectedModuleRouteId, (id) => id && loadRelatedRoutes(id));

onMounted(() => loadRoutes());
</script>

<template>
  <div class="w-full h-screen flex p-10 font-sans text-slate-900 overflow-hidden gap-6">
    
    <aside class="w-[320px] shrink-0 border border-slate-200 bg-white flex flex-col shadow-sm">
      <div class="px-6 py-5 border-b border-slate-100 shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estructura</p>
            <h2 class="text-lg font-bold text-slate-950">Interfaces</h2>
          </div>
          <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="brand" @click="openCreate" />
        </div>
      </div>

      <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <UInput v-model="qFrontend" icon="i-lucide-search" placeholder="Buscar página..." variant="subtle" size="xs" class="w-full" />
      </div>

      <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        <div v-if="frontendRoutes.length > frontendItemsPerPage" class="flex justify-center mb-2">
          <UPagination v-model:page="frontendPage" :items-per-page="frontendItemsPerPage" :total="frontendRoutes.length" size="xs" />
        </div>

        <button 
          v-for="route in paginatedFrontend" :key="route.id" 
          @click="selectedModuleRouteId = route.id"
          :class="selectedModuleRouteId === route.id 
            ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200/50 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50'"
          class="w-full text-left p-4 border rounded-none transition-all duration-200 group relative cursor-pointer"
        >
          <div class="flex justify-between items-start mb-1">
            <div class="text-[13px] font-black group-hover:text-brand-600 transition-colors truncate pr-6">{{ route.url }}</div>
            <UButton icon="i-lucide-pencil" variant="ghost" color="brand" size="xs" class="opacity-0 group-hover:opacity-100 absolute right-2 top-2" @click.stop="openEdit(route)" />
          </div>
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider opacity-70">{{ route.nombre }}</div>
        </button>

        <div v-if="frontendRoutes.length === 0" class="py-10 text-center opacity-40">
          <UIcon name="i-lucide-search-x" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-[10px] font-black uppercase tracking-widest">Sin páginas</p>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white border border-slate-200 shadow-sm">
      
      <header class="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Backend Connectivity</p>
          <h1 class="text-2xl font-bold text-slate-950 tracking-tight">Vinculación de Endpoints</h1>
        </div>
        <UButton 
          v-if="selectedModuleRouteId"
          icon="i-lucide-save" 
          size="sm"
          color="brand"
          :loading="isSavingRelated" 
          @click="saveRelatedRoutes"
          class="font-bold px-8 shadow-lg shadow-brand-500/10"
        >
          Guardar Cambios
        </UButton>
      </header>

      <div v-if="selectedModuleRouteId" class="px-6 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-center gap-4">
        <div class="flex-1 max-w-sm flex items-center gap-2">
          <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">Filtro:</span>
          <UInput v-model="q" size="xs" class="w-full" placeholder="Buscar API..." icon="i-lucide-search" variant="subtle" />
        </div>
        
        <div class="h-4 w-[1px] bg-slate-100 mx-2"></div>

        <div class="flex p-1 bg-white rounded-none border border-slate-200 overflow-x-auto shrink-0">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
            :class="activeTab === tab.value ? 'bg-slate-50 text-brand-600 shadow-sm border-slate-200' : 'text-slate-400 border-transparent'"
            class="px-3 py-1.5 text-[9px] font-black rounded-none border transition-all flex items-center gap-1.5 whitespace-nowrap uppercase tracking-tighter">
            {{ tab.label }}
            <span class="px-1.5 py-0.5 rounded-none text-[8px] bg-brand-50 text-brand-700">{{ getCount(tab.value) }}</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <div v-if="selectedModuleRouteId" class="h-full overflow-y-auto p-6 custom-scrollbar">
          <div v-if="filteredBackend.length > backendItemsPerPage" class="flex justify-center mb-6">
            <UPagination v-model:page="backendPage" :items-per-page="backendItemsPerPage" :total="filteredBackend.length" size="sm" class="rounded-none" />
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label v-for="api in paginatedBackend" :key="api.id" 
              class="flex items-center gap-3 p-4 border border-slate-200 rounded-none cursor-pointer hover:bg-slate-50 transition-all group relative overflow-hidden"
              :class="relatedRouteIdsDraft.has(api.id) ? 'border-brand-300 bg-brand-50' : 'bg-white opacity-80'"
            >
              <input type="checkbox" :checked="relatedRouteIdsDraft.has(api.id)" @change="toggleRelation(api.id)" class="accent-brand-500 h-4 w-4 z-10" />
              <div class="min-w-0 flex-1 z-10">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[9px] font-black uppercase text-brand-600 tracking-tighter">{{ api.metodo || "GET" }}</span>
                  <UButton icon="i-lucide-pencil" variant="ghost" color="brand" size="xs" class="opacity-0 group-hover:opacity-100" @click.stop="openEdit(api)" />
                </div>
                <div class="text-[12px] font-black text-slate-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight truncate">{{ api.url }}</div>
                <div class="text-[10px] text-slate-400 italic font-medium truncate">{{ api.nombre }}</div>
              </div>
              <div v-if="relatedRouteIdsDraft.has(api.id)" class="absolute left-0 top-0 bottom-0 bg-brand-500 w-1"></div>
            </label>
          </div>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 opacity-70 bg-slate-50/40">
          <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 mb-4 animate-pulse" />
          <p class="text-[10px] font-black uppercase tracking-[0.3em]">Selecciona una interfaz de la izquierda</p>
        </div>
      </div>
    </main>

    <ModuleRouteFormModal v-model="isModalOpen" :route="selectedRouteToEdit" :loading="isSavingNewRoute || isUpdatingRoute" @save="handleSave" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-500), 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--color-primary-500), 0.3); }
</style>