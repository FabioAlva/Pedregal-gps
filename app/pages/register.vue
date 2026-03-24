<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

definePageMeta({
  layout: 'auth'
})

const loading = ref(false)
const toast = useToast()

const schema = z
  .object({
    name: z.string().min(2, 'El nombre es requerido'),
    email: z.string().email('Correo no valido'),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma tu contrasena')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword']
  })

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await authClient.signUp.email({
      name: event.data.name,
      email: event.data.email,
      password: event.data.password
    })

    if (result.error) {
      throw new Error(result.error.message ?? 'No se pudo crear la cuenta')
    }

    toast.add({
      title: 'Cuenta creada',
      description: 'Ahora puedes iniciar sesion',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    await new Promise((resolve) => setTimeout(resolve, 700))
    await navigateTo('/login')
  } catch (error: any) {
    console.error('Error de registro:', error)

    toast.add({
      title: 'No se pudo registrar',
      description: error?.message ?? 'Intenta de nuevo',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex h-full w-full max-w-md flex-col justify-center">
    <div class="text-left space-y-3">
      <div>
        <p class="mt-1 text-xs uppercase tracking-widest text-slate-600 dark:text-white/65">
          Portal seguro
        </p>

        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Crear cuenta
        </h1>
      </div>
    </div>

    <UForm :schema="schema" :state="state" class="mt-8 space-y-5" @submit="onSubmit">
      <UFormField
        label="Nombre"
        name="name"
        :ui="{ label: 'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white/70 font-semibold' }"
      >
        <UInput
          v-model="state.name"
          placeholder="Tu nombre"
          icon="i-lucide-user"
          class="w-full"
          :ui="{ base: 'bg-white/70 text-slate-900 placeholder:text-slate-500 border border-slate-300/80 focus:border-brand-500 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35 dark:border-white/20 dark:focus:border-brand-300' }"
        />
      </UFormField>

      <UFormField
        label="Correo electronico"
        name="email"
        :ui="{ label: 'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white/70 font-semibold' }"
      >
        <UInput
          v-model="state.email"
          type="email"
          placeholder="ejemplo@correo.com"
          icon="i-lucide-mail"
          class="w-full"
          :ui="{ base: 'bg-white/70 text-slate-900 placeholder:text-slate-500 border border-slate-300/80 focus:border-brand-500 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35 dark:border-white/20 dark:focus:border-brand-300' }"
        />
      </UFormField>

      <UFormField
        label="Contrasena"
        name="password"
        :ui="{ label: 'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white/70 font-semibold' }"
      >
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-lock"
          class="w-full"
          :ui="{ base: 'bg-white/70 text-slate-900 placeholder:text-slate-500 border border-slate-300/80 focus:border-brand-500 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35 dark:border-white/20 dark:focus:border-brand-300' }"
        />
      </UFormField>

      <UFormField
        label="Confirmar contrasena"
        name="confirmPassword"
        :ui="{ label: 'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white/70 font-semibold' }"
      >
        <UInput
          v-model="state.confirmPassword"
          type="password"
          placeholder="••••••••"
          icon="i-lucide-shield-check"
          class="w-full"
          :ui="{ base: 'bg-white/70 text-slate-900 placeholder:text-slate-500 border border-slate-300/80 focus:border-brand-500 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35 dark:border-white/20 dark:focus:border-brand-300' }"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Crear cuenta"
        block
        :loading="loading"
        size="lg"
        color="primary"
        icon="i-lucide-user-plus"
        class="mt-2"
      />
    </UForm>

    <p class="mt-6 text-center text-sm text-slate-600 dark:text-white/70">
      Ya tienes cuenta?
      <NuxtLink to="/login" class="font-semibold text-brand-600 hover:underline dark:text-brand-300">
        Iniciar sesion
      </NuxtLink>
    </p>
  </div>
</template>