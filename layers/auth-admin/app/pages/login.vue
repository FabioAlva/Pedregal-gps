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
    await navigateTo("/dashboard", { replace: true })
  }
}
</script>

<template>
  <div class="flex h-full font-bold w-full max-w-md flex-col justify-center">
    <div class="text-left space-y-3">
      <div>
        <p
          class="mt-1 text-xs uppercase tracking-widest text-slate-900 dark:text-white/65"
        >
          Iniciar sesion
        </p>
        <LogoPedregal
          class="text-brand-500 dark:text-white mt-4 hidden md:block w-[400px] h-auto"
        />
      </div>
    </div>

     <UForm
      :schema="schema"
      :state="state"
      class="mt-8 space-y-5"
      @submit="onSubmit"
     >
      <UFormField
        label="Correo Electrónico"
        name="email"
        :ui="{
          label:
            'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white font-bold',
          error: 'text-[11px] mt-1 text-red-500 dark:text-white font-medium',
        }"
      >
        <UInput
          v-model="state.email"
          type="email"
          placeholder="ejemplo@correo.com"
          icon="i-lucide-mail"
          class="w-full"
          :ui="{
            base: 'bg-white/70 text-slate-900 border-slate-300 dark:bg-black/40 dark:text-white dark:border-white/20 dark:focus:border-white',
          }"
        />
      </UFormField>

      <UFormField
        label="Contraseña"
        name="password"
        :ui="{
          label:
            'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white font-bold',
          error: 'text-[11px] mt-1 text-red-500 dark:text-white font-medium',
        }"
      >
        <UInput
          v-model="state.password"
          :type="isPasswordVisible ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-lucide-lock"
          class="w-full"
          :ui="{
            base: 'bg-white/70 text-slate-900 border-slate-300 dark:bg-black/40 dark:text-white dark:border-white/20 dark:focus:border-white',
          }"
        >
          <template #trailing>
            <UButton
              color="primary"
              variant="link"
              :icon="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :padded="false"
              @click="isPasswordVisible = !isPasswordVisible"
              class="dark:text-white/70"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        type="submit"
        label="Ingresar"
        block
        :loading="isLoggingIn"
        size="lg"
        class="mt-2 font-bold"
        :ui="{
          base: 'dark:bg-white dark:text-[#7b0d18] dark:hover:bg-slate-200 transition-colors',
        }"
        icon="i-lucide-log-in"
      />
    </UForm>
  </div>
</template>
