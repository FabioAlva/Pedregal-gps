<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({ layout: "auth" });

const { login, isLoggingIn } = await useAuthSession();
const isPasswordVisible = ref(false); 

const schema = z.object({
  email: z
    .string()
    .email("Correo electrónico no válido")
    .nonempty("Correo electrónico es requerido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .nonempty("Contraseña es requerida"),
});

type Schema = z.output<typeof schema>;
const state = reactive({ email: "", password: "" });

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const success = await login(event.data.email, event.data.password);
  if (success) {
    await navigateTo("/", { replace: true })
  }
}
</script>
<template>
  <div class="flex h-full w-full max-w-sm flex-col justify-center">
    <header class="mb-6">
      <p class="text-[9px] uppercase tracking-[0.4em] text-slate-500 dark:text-white/40 font-black mb-2">
        Portal de Acceso
      </p>
      
      <div class="space-y-1">
        <h2 class="font-serif text-5xl xl:text-6xl font-bold text-brand-500 tracking-tighter leading-[0.75]">
          Pedregal
        </h2>
        <p class="font-serif italic font-medium text-brand-500 text-xl lowercase opacity-90 ml-1 tracking-tight">
    the fruit company
  </p>
      </div>
      
      <div class="mt-4 h-[2px] w-10 bg-brand-500" />
    </header>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-1 w-full" 
      @submit="onSubmit"
    >
      <UFormField 
        label="Usuario" 
        name="email"
        :ui="{ 
          container: 'mb-5', 
          error: 'text-[10px] absolute mt-1 text-red-500' 
        }"
      >
        <UInput
          v-model="state.email"
          type="email"
          placeholder="usuario@pedregal.com"
          icon="i-lucide-user"
          size="md"
          class="w-full"
        />
      </UFormField>

      <UFormField 
        label="Contraseña" 
        name="password"
        :ui="{ 
          container: 'mb-5', 
          error: 'text-[10px] absolute mt-1 text-red-500' 
        }"
      >
        <UInput
          v-model="state.password"
          :type="isPasswordVisible ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-lucide-shield-check"
          size="md"
          class="w-full"
        >
          <template #trailing>
            <UButton
              variant="link"
              color="neutral"
              :icon="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="isPasswordVisible = !isPasswordVisible"
            />
          </template>
        </UInput>
      </UFormField>

      <div class="pt-4">
        <UButton
          type="submit"
          block
          :loading="isLoggingIn"
          size="lg"
          class="transition-all duration-300 active:scale-[0.98]"
        >
          Iniciar Sesión
        </UButton>
      </div>
    </UForm>
  </div>
</template>