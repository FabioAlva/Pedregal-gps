<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <UMain class="relative min-h-screen overflow-hidden bg-neutral-100 text-slate-900 dark:bg-brand-950 dark:text-white">
    <div class="absolute inset-0 hidden lg:block">
      <iframe
        title="Mapa OpenStreetMap"
        src="https://www.openstreetmap.org/export/embed.html?bbox=-80.7020%2C-5.2420%2C-80.5620%2C-5.1020&layer=mapnik&marker=-5.1726%2C-80.6297"
        class="h-full w-full border-0 map-brand-tones"
        loading="lazy"
      />
      
    </div>

    <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/62 via-slate-100/68 to-slate-200/74 dark:from-brand-950/70 dark:via-brand-900/78 dark:to-brand-950/92" />
    <div class="pointer-events-none absolute inset-0 map-grid-overlay" />

    <div class="absolute top-0 left-0 hidden lg:flex flex-col px-12 pt-6 pointer-events-none z-0 h-screen">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 bg-white/90 dark:bg-white rounded-lg border-2 border-slate-300 dark:border-white/20 flex items-center justify-center p-2 shadow-sm flex-shrink-0">
            <img src="/logo2.png" alt="TGI Logo" class="w-full h-full object-contain" />
          </div>
          <div>
            <p class="text-sm font-black uppercase text-slate-700 dark:text-white">TGI Ingeniería</p>
          </div>
        </div>

        <div class="max-w-xl mt-auto pb-16">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700/80 dark:text-brand-100/90">Plataforma de Monitoreo</p>
          <h1 class="mt-4 text-5xl font-black leading-[0.98] tracking-tight text-slate-900 dark:text-white">
            Control operacional en tiempo real
          </h1>
          <p class="mt-4 max-w-md text-sm text-slate-700/90 dark:text-brand-100/90">
            Gestiona accesos, trazabilidad y estado de flota desde una sola vista.
          </p>
        </div>
      </div>

    <div class="fixed right-0 top-0 w-auto h-screen lg:w-[520px] z-20 pointer-events-auto flex flex-col bg-white/92 dark:bg-brand-900/95 lg:border-l lg:border-slate-300/65 dark:lg:border-white/10">
        <UColorModeButton class="absolute right-4 top-4 z-20" />

        <div class="flex flex-1 items-stretch px-4 py-16 sm:px-6 lg:px-10">
          <div class="h-full w-full">
            <slot />
          </div>
        </div>

        <footer class="border-t border-slate-300/70 px-6 py-4 dark:border-white/10">
          <p class="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-brand-100/80">
            Copyright {{ currentYear }} Plataforma de Monitoreo. Todos los derechos reservados @tgi.
          </p>
        </footer>
      </div>
  </UMain>
</template>

<style>
.map-brand-tones {
  filter: grayscale(0.72) sepia(0.14) hue-rotate(182deg) saturate(0.62) contrast(1.04) brightness(0.76);
}

.map-grid-overlay {
  background-image: radial-gradient(rgba(219, 225, 255, 0.18) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  opacity: 0.15;
  pointer-events: none;
}

section {
  box-shadow: -8px 0 20px rgba(0, 0, 0, 0.15);
}

.dark section {
  box-shadow: -8px 0 24px rgba(6, 182, 212, 0.15);
}
</style>
