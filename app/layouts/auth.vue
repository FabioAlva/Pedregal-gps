<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
<template>
  <UMain class="relative min-h-screen overflow-hidden bg-neutral-100 text-slate-900 dark:bg-slate-950">
    <div class="absolute inset-0 hidden lg:block">
      <iframe
        title="Mapa OpenStreetMap"
        src="https://www.openstreetmap.org/export/embed.html?bbox=-80.6047%2C-5.0961%2C-80.5847%2C-5.0761&layer=mapnik&marker=-5.086195%2C-80.5947817"
        class="h-full w-full border-0 map-tones transition-all duration-700"
        loading="lazy"
      />
    </div>

    <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/40 to-transparent" />
    
    <div class="pointer-events-none absolute inset-0 map-grid-overlay opacity-10" />

    <div class="absolute top-0 left-0 hidden lg:flex flex-col px-12 pt-6 pointer-events-none z-0 h-screen">
        <div class="flex items-center gap-4">
<LogoTGI class="h-8 w-auto text-[#005a94]" />
          <!-- <div class="w-8 h-8 bg-white/90 rounded-lg border-2 border-slate-300 flex items-center justify-center p-2 shadow-sm flex-shrink-0">
            <img src="/LogoTGI2.svg" alt="TGI Logo" class="w-full h-full object-contain" />
                      <img src="/LogoTGI2.svg" alt="TGI Logo" class="w-full h-full object-contain" />

          </div> -->

          <!-- <p class="text-sm font-black uppercase text-slate-700">TGI Perú</p> -->
        </div>

        <div class="max-w-xl mt-auto pb-16">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700/80">Plataforma de Monitoreo</p>
          <h1 class="mt-4 text-5xl font-black leading-[0.98] tracking-tight text-slate-900">
            Control operacional en tiempo real
          </h1>
          <p class="mt-4 max-w-md text-sm text-slate-700/90">
            Gestiona accesos, trazabilidad y estado de flota desde una sola vista.
          </p>
        </div>
    </div>

    <div class="fixed right-0 top-0 w-auto h-screen lg:w-[520px] z-20 pointer-events-auto flex flex-col bg-white/95 dark:bg-brand-500 lg:border-l lg:border-slate-300/65 dark:lg:border-white/10 transition-colors duration-500">
        <UColorModeButton class="absolute right-4 top-4 z-20" />
        <div class="flex flex-1 items-stretch px-4 py-16 sm:px-6 lg:px-10 dark:text-white">
          <div class="h-full w-full">
            <slot />
          </div>
        </div>
        <footer class="border-t border-slate-300/70 px-6 py-4 dark:border-white/20">
          <p class="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-white/80">
            Copyright {{ currentYear }} Plataforma de Monitoreo. @tgi.
          </p>
        </footer>
    </div>
  </UMain>
</template>

<style scoped>
/* Modo Claro: Se ve el verde */
.map-tones {
  filter: grayscale(0.4) contrast(1.1) brightness(0.95) saturate(0.8);
}

/* Modo Dark*/
.dark .map-tones {
  filter: grayscale(1) contrast(1.1) brightness(0.9);
}

.map-grid-overlay {
  background-image: radial-gradient(rgba(0, 0, 0, 0.1) 0.5px, transparent 0.5px);
  background-size: 32px 32px;
}
</style>