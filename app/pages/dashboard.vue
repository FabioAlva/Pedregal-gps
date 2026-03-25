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
    layer: 'layer-gps' 
  },
  { 
    title: 'Gestión de Activos', 
    desc: 'Administración de hardware, flotas, vehículos y equipos.', 
    icon: 'i-lucide-truck', 
    to: '/gps/team-fleet',
    layer: 'layer-fleet' 
  },
  { 
    title: 'Infraestructura IoT', 
    desc: 'Control de tópicos MQTT, telemetría y logs técnicos.', 
    icon: 'i-lucide-cpu', 
    to: '/configuracion/topicos',
    layer: 'layer-iot'
  },
  { 
    title: 'Clientes y Empresas', 
    desc: 'Gestión de organizaciones, suscripciones y multitenencia.', 
    icon: 'i-lucide-building-2', 
    to: '/admin/organizations',
    layer: 'layer-admin'
  },
  { 
    title: 'Seguridad y Sistema', 
    desc: 'Control de acceso, roles, usuarios y logs de auditoría.', 
    icon: 'i-lucide-shield-check', 
    to: '/configuracion/roles',
    layer: 'layer-admin'
  }
])
</script>

<template>
  <div class="p-6 w-full mx-auto space-y-8">
    <header>
      <p class="text-xs font-bold text-primary uppercase tracking-widest">Dashboard SaaS</p>
      <h1 class="text-3xl font-black text-highlighted">Visión General</h1>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
      <NuxtLink v-for="item in modules" :key="item.title" :to="item.to" class="group">
        <UCard class="h-full hover:border-primary/50 transition-all duration-300 transform group-hover:-translate-y-1 shadow-sm">
          <template #header>
            <div class="flex items-center gap-4">
              <div class="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <UIcon :name="item.icon" class="w-7 h-7" />
              </div>
              <div class="min-w-0">
                <div class="font-bold text-highlighted truncate">{{ item.title }}</div>
                <div class="text-[10px] text-muted font-mono uppercase tracking-tighter">{{ item.layer }}</div>
              </div>
            </div>
          </template>
          
          <div class="space-y-3">
            <p class="text-sm text-muted leading-relaxed min-h-[40px]">
              {{ item.desc }}
            </p>
            <div class="flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Acceder ahora <UIcon name="i-lucide-arrow-right" class="ml-1 w-3 h-3" />
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>