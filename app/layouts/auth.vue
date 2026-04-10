<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <UMain class="relative min-h-screen overflow-hidden font-sans selection:bg-brand-500 selection:text-white bg-[#050505]">
    
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <img 
        src="/images/fondo-login.jpg" 
        class="absolute inset-0 w-full h-full object-cover scale-105"
        alt="Satellite View"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
      <div class="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-brand-900/15 blur-[120px]" />
    </div>

    <div class="relative z-10 grid lg:grid-cols-[1fr_520px] min-h-screen">
      
      <section class="hidden lg:flex flex-col justify-between p-20 pb-16">
        
        <div class="flex items-center gap-5">
          <div class="flex items-center gap-4">
           <img 
            src="/images/logo-tgi.svg" 
            alt="P" 
            class=" w-full h-10 object-contain "
          />
          </div>
        </div>

        <div class="max-w-3xl">
          <div class="flex items-center gap-3 mb-10">
            <div class="h-px w-10 bg-brand-500" />
            <span class="text-[10px] font-black uppercase tracking-[0.5em] text-brand-500">Enterprise Solution</span>
          </div>
          
          <h1 class="font-serif text-6xl xl:text-8xl font-bold leading-[0.85] tracking-tighter text-white">
            Sistema de <br/>
            <span class="text-red-600 italic font-medium">Gestión</span> de <br/>
            Flota Agrícola
          </h1>
          
          <p class="mt-12 max-w-sm text-lg text-white/70 leading-relaxed font-light border-l-2 border-brand-500 pl-8">
            Gestión de flotas y monitoreo en tiempo real para la agricultura moderna.
          </p>
        </div>

        <div class="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.5em]">
           <span class="w-2 h-2 rounded-full bg-brand-500" />
           <span>Piura, Perú</span>
        </div>
      </section>

      <aside class="relative flex flex-col bg-white dark:bg-slate-950 shadow-[-40px_0_100px_rgba(0,0,0,0.8)] border-l border-white/5">
        <div class="absolute right-10 top-10">
          <UColorModeButton />
        </div>

        <div class="flex-1 flex flex-col justify-center px-12 lg:px-24">
          <div class="w-full max-w-sm mx-auto">
            <slot />
          </div>
        </div>

        <footer class="p-12 flex justify-between items-end border-t border-slate-100 dark:border-white/5">
          <div class="space-y-1">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500"> @TGI INGENIERIA </p>
          </div>
          <p class="text-[10px] font-bold text-slate-400">© {{ currentYear }}</p>
        </footer>
      </aside>
    </div>

  </UMain>
</template>

<style scoped>
section, aside {
  animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
</style>