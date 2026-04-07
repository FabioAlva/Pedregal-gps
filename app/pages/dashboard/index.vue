<script setup lang="ts">
import { computed } from 'vue'

// ═══════════════════════════════════════════════════════════════
// FUENTES DE DATO REALES:
//   [GRIFO]  = Registro manual de carga (unidad + galones + lote + hora)
//   [GPS]    = Dispositivo GPS (posición, velocidad, motor ON/OFF)
//   [TALLER] = Módulo de Órdenes de Trabajo / Mantenimiento
//   [DVIR]   = Checklist diario del operador
//   [DOCS]   = Módulo de Documentos (SOAT, brevetes, RT)
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 1. ESTADO DEL CAMPO
//    Fuente: Ingreso manual del agrónomo
// ─────────────────────────────────────────────
const fieldCondition = {
  temp: '34°C',
  soil: 'Seco / Firme',
  recommendation: 'Condiciones óptimas para arado pesado.'
}

// ─────────────────────────────────────────────
// 2. KPIs — Solo métricas calculables con tus datos reales
//
//  Gasto Combustible  [GRIFO]  SUM(galones×precio_dia)
//  Horas Ralentí      [GPS]    SUM(motor ON + vel<3km/h + >5min) ÷ 3600
//  Flota Disponible   [TALLER] unidades con estado=activo ÷ total
//  Galones Cargados   [GRIFO]  SUM(galones del día, todas las unidades)
//  DVIR Conformidad   [DVIR]   checklists sin defectos ÷ total del día
//  Docs por Vencer    [DOCS]   COUNT(fecha_venc - hoy ≤ 15 días)
// ─────────────────────────────────────────────
const kpis = [
  {
    label: 'Gasto Combustible',
    value: 'S/ 8,420',
    sub: 'Cargas de hoy · 1,240 gal',
    icon: 'i-lucide-fuel',
    color: 'red',
    trend: '+12% vs ayer'
  },
  {
    label: 'Horas Ralentí',
    value: '18.4 h',
    sub: 'Motor ON · velocidad = 0',
    icon: 'i-lucide-timer-off',
    color: 'orange',
    trend: '≈ S/ 1,100 quemados'
  },
  {
    label: 'Flota Disponible',
    value: '120 / 142',
    sub: '18 en taller · 4 de baja',
    icon: 'i-lucide-tractor',
    color: 'emerald',
    trend: '84.5% disponibilidad'
  },
  {
    label: 'Galones Cargados',
    value: '1,240 gal',
    sub: 'Total flota · cargas de hoy',
    icon: 'i-lucide-droplets',
    color: 'blue',
    trend: 'Ref. normal: ~1,050 gal/día'
  },
  {
    label: 'DVIR Conformidad',
    value: '31 / 38',
    sub: '7 checklists con observaciones',
    icon: 'i-lucide-clipboard-check',
    color: 'violet',
    trend: '81.6% conformidad'
  },
  {
    label: 'Docs por Vencer',
    value: '3 docs',
    sub: 'SOAT · Brevete · Rev. Técnica',
    icon: 'i-lucide-file-warning',
    color: 'red',
    trend: '1 ya vencido'
  }
]

// ─────────────────────────────────────────────
// 3. Trabajo vs Ralentí por día
//    [GPS] motor ON + vel > 3 km/h = trabajando
//          motor ON + vel < 3 km/h + duración > 5 min = ralentí
// ─────────────────────────────────────────────
const efficiencyOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    textStyle: { color: '#e2e8f0', fontSize: 11 },
    formatter: (params: any) =>
      `<b style="color:#94a3b8">${params[0].name}</b><br/>` +
      `🟢 Trabajando: <b>${params[0].value} h</b><br/>` +
      `🟠 Ralentí: <b>${params[1].value} h</b>`
  },
  legend: {
    bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10,
    textStyle: { fontSize: 10, color: '#94a3b8' }
  },
  grid: { top: 16, left: 36, right: 12, bottom: 36 },
  xAxis: {
    type: 'category',
    data: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    axisLine: { lineStyle: { color: '#334155' } },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  series: [
    {
      name: 'Horas Trabajando',
      type: 'bar', stack: 'total',
      data: [420, 385, 410, 395, 360, 280, 180],
      color: '#10b981'
    },
    {
      name: 'Ralentí (Pérdida)',
      type: 'bar', stack: 'total',
      data: [48, 62, 35, 55, 78, 40, 22],
      color: '#f97316',
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }
  ]
}))

// ─────────────────────────────────────────────
// 4. Galones cargados por Lote
//    [GRIFO] SUM(galones) GROUP BY lote_declarado
//    ⚠ El operador DEBE indicar el lote al registrar la carga.
//      Sin ese campo en el formulario, este gráfico no existe.
// ─────────────────────────────────────────────
const fuelByZoneOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    textStyle: { color: '#e2e8f0', fontSize: 11 },
    formatter: (params: any) =>
      `<b style="color:#94a3b8">${params[0].name}</b><br/>⛽ <b>${params[0].value} gal</b>`
  },
  grid: { top: 10, left: 12, right: 60, bottom: 10, containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: ['Lote 12', 'Sector Sur', 'Ruta Principal', 'La Pampa', 'Lote 44'],
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  series: [{
    type: 'bar',
    data: [
      { value: 148, itemStyle: { color: '#10b981' } },
      { value: 223, itemStyle: { color: '#10b981' } },
      { value: 301, itemStyle: { color: '#f59e0b' } },
      { value: 448, itemStyle: { color: '#f97316' } },
      { value: 852, itemStyle: { color: '#ef4444' } }
    ],
    label: {
      show: true, position: 'right',
      formatter: '{c} gal', fontSize: 10, fontWeight: 'bold', color: '#94a3b8'
    },
    itemStyle: { borderRadius: [0, 4, 4, 0] },
    barMaxWidth: 18
  }]
}))

// ─────────────────────────────────────────────
// 5. Top 5 unidades que más cargan
//    [GRIFO] SUM(galones) GROUP BY unidad ORDER BY DESC LIMIT 5
//    Reemplaza "Costo/Km" — no aplica a tractores agrícolas.
//    Una unidad que carga el doble de sus pares puede tener:
//    fuga de aceite, inyectores en mal estado, o robo.
// ─────────────────────────────────────────────
const topConsumersOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    textStyle: { color: '#e2e8f0', fontSize: 11 },
    formatter: (params: any) =>
      `<b>${params[0].name}</b><br/>⛽ ${params[0].value} gal cargados hoy`
  },
  grid: { top: 10, left: 12, right: 60, bottom: 10, containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: ['T-214', 'T-087', 'C-441', 'T-902', 'T-155'],
    axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 10 }
  },
  series: [{
    type: 'bar',
    data: [
      { value: 68,  itemStyle: { color: '#10b981' } },
      { value: 74,  itemStyle: { color: '#10b981' } },
      { value: 89,  itemStyle: { color: '#f59e0b' } },
      { value: 112, itemStyle: { color: '#f97316' } },
      { value: 198, itemStyle: { color: '#ef4444' } }
    ],
    label: {
      show: true, position: 'right',
      formatter: '{c} gal', fontSize: 10, fontWeight: 'bold', color: '#94a3b8'
    },
    itemStyle: { borderRadius: [0, 4, 4, 0] },
    barMaxWidth: 18
  }]
}))

// ─────────────────────────────────────────────
// 6. Documentos por vencer
//    [DOCS + OPERADORES] WHERE fecha_venc - NOW() <= 15 días
// ─────────────────────────────────────────────
const documents = [
  { unit: 'T-902',      type: 'Inspección DVIR',  daysLeft: -2, status: 'Vencido'    },
  { unit: 'P5F-936',    type: 'SOAT',             daysLeft: 3,  status: 'En 3 días'  },
  { unit: 'Arado A-12', type: 'Mantenimiento PM', daysLeft: 5,  status: 'En 5 días'  },
  { unit: 'Op. García', type: 'Brevete A-IIb',    daysLeft: 8,  status: 'En 8 días'  },
  { unit: 'C-441',      type: 'Revisión Técnica', daysLeft: 12, status: 'En 12 días' },
]

// ─────────────────────────────────────────────
// 7. Alertas recientes
//    [GPS]   velocidad > límite, salida de geocerca
//    [GRIFO] unidad que carga >50% sobre su promedio histórico
// ─────────────────────────────────────────────
const alerts = [
  { icon: 'i-lucide-droplets',    text: 'T-155: Cargó 198 gal · triple del promedio',  type: 'fuel',  time: 'Hace 12 min' },
  { icon: 'i-lucide-siren',       text: 'C-441: Velocidad 94 km/h en Ruta 1',           type: 'speed', time: 'Hace 28 min' },
  { icon: 'i-lucide-map-pin-off', text: 'T-087: Salió de geocerca Lote 44',             type: 'geo',   time: 'Hace 41 min' },
  { icon: 'i-lucide-siren',       text: 'T-214: Velocidad 88 km/h en acceso norte',     type: 'speed', time: 'Hace 1 h'    },
]

// ── Helpers ──────────────────────────────────
const docColor = (days: number) => {
  if (days < 0)  return { badge: 'bg-red-500/20 text-red-400 border border-red-500/30',         dot: 'bg-red-500'    }
  if (days <= 5) return { badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', dot: 'bg-orange-500' }
  return               { badge: 'bg-slate-700 text-slate-400 border border-slate-600',           dot: 'bg-slate-500'  }
}

const alertColor = (type: string) => ({
  fuel:  'text-red-400 bg-red-500/10 border-red-500/20',
  speed: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  geo:   'text-blue-400 bg-blue-500/10 border-blue-500/20'
}[type] ?? 'text-slate-400 bg-slate-800 border-slate-700')

const kpiColors: Record<string, { card: string; value: string; icon: string; badge: string }> = {
  red:     { card: 'border-red-500/20',     value: 'text-red-400',     icon: 'bg-red-500/10 text-red-400',        badge: 'bg-red-500/15 text-red-400'      },
  orange:  { card: 'border-orange-500/20',  value: 'text-orange-400',  icon: 'bg-orange-500/10 text-orange-400',  badge: 'bg-orange-500/15 text-orange-400' },
  emerald: { card: 'border-emerald-500/20', value: 'text-emerald-400', icon: 'bg-emerald-500/10 text-emerald-400',badge: 'bg-emerald-500/15 text-emerald-400'},
  blue:    { card: 'border-blue-500/20',    value: 'text-blue-400',    icon: 'bg-blue-500/10 text-blue-400',      badge: 'bg-blue-500/15 text-blue-400'     },
  violet:  { card: 'border-violet-500/20',  value: 'text-violet-400',  icon: 'bg-violet-500/10 text-violet-400',  badge: 'bg-violet-500/15 text-violet-400' },
}
</script>

<template>
  <div class="flex flex-col w-full min-h-full overflow-y-auto p-4 gap-4 font-mono">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Sistema activo · GPS en línea
          </span>
        </div>
        <h1 class="text-2xl font-black  tracking-tight mt-1">Dashboard </h1>
        <p class="text-xs text-slate-500 mt-0.5">Control operativo en tiempo real · Piura – Valle</p>
      </div>
      <div class="flex items-center gap-4  border border-slate-700 rounded-lg px-4 py-2.5">
        <div class="text-center">
          <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Suelo</p>
          <p class="text-sm font-black text-amber-400">{{ fieldCondition.soil }}</p>
        </div>
        <div class="w-px h-8 "></div>
        <div class="text-center">
          <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Temp.</p>
          <p class="text-sm font-black text-orange-400">{{ fieldCondition.temp }}</p>
        </div>
        <div class="w-px h-8 "></div>
        <div class="text-left max-w-[200px]">
          <p class="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Agrónomo</p>
          <p class="text-xs font-semibold text-slate-300 leading-tight">{{ fieldCondition.recommendation }}</p>
        </div>
      </div>
    </div>

    <!-- ── KPIs ───────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <div
        v-for="kpi in kpis" :key="kpi.label"
        class="rounded-xl border p-3.5 flex flex-col justify-between gap-2"
        :class="kpiColors[kpi.color]?.card ?? 'border-slate-700'"
      >
        <div class="flex justify-between items-start">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight max-w-[80%]">{{ kpi.label }}</p>
          <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="kpiColors[kpi.color]?.icon">
            <UIcon :name="kpi.icon" class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p class="text-xl font-black tracking-tight leading-none" :class="kpiColors[kpi.color]?.value">{{ kpi.value }}</p>
          <p class="text-[9px] text-slate-500 mt-1 leading-tight">{{ kpi.sub }}</p>
        </div>
        <div class="rounded-md px-2 py-1 text-[9px] font-bold w-fit" :class="kpiColors[kpi.color]?.badge">
          {{ kpi.trend }}
        </div>
      </div>
    </div>

    <!-- ── FILA 1: Trabajo vs Ralentí + Galones por Lote ──────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <div class="border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white">Trabajo vs Ralentí</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">GPS · motor ON + vel &gt; 3 km/h vs vel = 0</p>
          </div>
          <span class="text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-md px-2 py-1">
            18.4 h ralentí hoy
          </span>
        </div>
        <div class="h-[200px] w-full">
          <ClientOnly><VChart :option="efficiencyOption" autoresize /></ClientOnly>
        </div>
      </div>

      <div class="border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white">Galones Cargados por Lote</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">Grifo · SUM(gal) agrupado por lote declarado</p>
          </div>
          <span class="text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 rounded-md px-2 py-1">
            ⚠ Lote 44 inusual
          </span>
        </div>
        <div class="h-[200px] w-full">
          <ClientOnly><VChart :option="fuelByZoneOption" autoresize /></ClientOnly>
        </div>
        <p class="text-[9px] text-slate-600 mt-2">
          * Requiere que el operador declare el lote en cada carga del grifo
        </p>
      </div>

    </div>

    <!-- ── FILA 2: Top consumo + Alertas + Docs ──────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

      <div class="col-span-12 lg:col-span-4 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="mb-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-white">Top Consumo por Unidad</h3>
          <p class="text-[10px] text-slate-500 mt-0.5">Grifo · SUM(gal) por unidad hoy · anomalías en rojo</p>
        </div>
        <div class="h-[180px] w-full">
          <ClientOnly><VChart :option="topConsumersOption" autoresize /></ClientOnly>
        </div>
        <p class="text-[9px] text-red-500/70 mt-2 leading-tight">
          🔴 T-155 cargó 198 gal — casi el triple del promedio (68 gal). Revisar.
        </p>
      </div>

      <div class="col-span-12 lg:col-span-4 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white">Alertas Recientes</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">GPS · Grifo · Geocercas</p>
          </div>
          <span class="text-[9px] font-black text-white rounded-full px-2 py-0.5">12 activas</span>
        </div>
        <div class="flex flex-col gap-2.5 flex-1">
          <div
            v-for="alert in alerts" :key="alert.text"
            class="flex items-start gap-2.5 rounded-lg p-2.5 border"
            :class="alertColor(alert.type)"
          >
            <UIcon :name="alert.icon" class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold leading-tight">{{ alert.text }}</p>
              <p class="text-[9px] text-slate-500 mt-0.5">{{ alert.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 border border-slate-800 rounded-xl p-4 flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white">Docs & Permisos</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">Vencen en ≤ 15 días · SOAT · Brevetes · PM</p>
          </div>
        </div>
        <div class="flex flex-col gap-2 flex-1">
          <div
            v-for="doc in documents" :key="doc.unit + doc.type"
            class="flex justify-between items-center py-2 border-b border-slate-800 last:border-0"
          >
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="docColor(doc.daysLeft).dot"></div>
              <div>
                <p class="text-xs font-black text-slate-200">{{ doc.unit }}</p>
                <p class="text-[10px] text-slate-500">{{ doc.type }}</p>
              </div>
            </div>
            <span class="text-[9px] font-bold rounded-md px-2 py-1" :class="docColor(doc.daysLeft).badge">
              {{ doc.status }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.echarts { width: 100%; height: 100%; }
</style>