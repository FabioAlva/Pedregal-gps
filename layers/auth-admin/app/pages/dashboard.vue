<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'

definePageMeta({ layout: 'dashboard' })

const modules = ref([
  { 
    title: 'Centro de Monitoreo', 
    desc: 'Visualización en vivo, rastreo GPS y reportes operativos.', 
    icon: 'i-lucide-map-pin', 
    to: '/gps',
  },
  { 
    title: 'Gestión de Activos', 
    desc: 'Administración de hardware, flotas, vehículos y equipos.', 
    icon: 'i-lucide-truck', 
    to: '/fleet-manager/fleets',
  },
 
  { 
    title: 'Seguridad y Sistema', 
    desc: 'Control de acceso, roles, usuarios y logs de auditoría.', 
    icon: 'i-lucide-shield-check', 
    to: '/auth-admin/roles',
    layer: 'layer-admin'
  }
])
</script><template>
  <div class="p-8 w-full mx-auto space-y-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
    
    <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-200 dark:border-white/10">
      
      <div class="flex items-center gap-6">
        <div class="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
          <UIcon name="i-lucide-layout-grid" class="w-9 h-9" />
        </div>

        <div class="flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1">
            <p class="text-[10px] font-black uppercase tracking-[0.4em] text-primary leading-none">
              Unidad Central de Operaciones
            </p>
          </div>
          <h1 class="text-5xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-[0.8]">
            Panel de Control
          </h1>
        </div>
      </div>

      <div class="flex items-center h-16 px-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm min-w-[320px]">
        <div class="flex-1 text-center">
          <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Módulos</p>
          <p class="text-3xl font-black text-slate-950 dark:text-white leading-none">{{ modules.length }}</p>
        </div>
        
        <div class="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-6" />
        
        <div class="flex-1 text-center">
          <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Estado</p>
          <div class="flex items-center justify-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-500" />
            <p class="text-xs font-black text-slate-900 dark:text-white uppercase">Online</p>
          </div>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <NuxtLink v-for="item in modules" :key="item.title" :to="item.to" class="group">
        <UCard class="h-full border-none ring-1 ring-slate-200 dark:ring-white/10 dark:bg-slate-900/50 hover:ring-2 hover:ring-primary/50 transition-all duration-500">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <UIcon :name="item.icon" class="w-8 h-8" />
              </div>
              <UIcon name="i-lucide-arrow-up-right" class="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
            </div>
          </template>
          
          <div class="space-y-4">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{{ item.title }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ item.desc }}</p>
            <div class="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-primary">
              <div class="h-[2px] w-6 bg-primary" />
              <span>Inicializar Unidad</span>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>