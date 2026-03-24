<script setup lang="ts">

import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'
import { resolveBestAuthorizedFrontendRoute } from '~/lib/post-login-route'

definePageMeta({
  layout: 'auth'
})

const loading = ref(false) 
const toast = useToast()

const schema = z.object({
  email: z.string().email('Correo electrónico no válido').nonempty('Correo electrónico es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').nonempty('Contraseña es requerida')
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await authClient.signIn.email({
      email: event.data.email,
      password: event.data.password
    })

    if (result.error) {
      throw new Error(result.error.message ?? 'Credenciales inválidas')
    }

    toast.add({
      title: '✓ Bienvenido',
      description: 'Sesión iniciada correctamente',
      color: 'success', 
      icon: 'i-heroicons-check-circle'
    })

    // Pequeña pausa para que el usuario vea el mensaje de éxito
    await new Promise(resolve => setTimeout(resolve, 800))

    const targetRoute = await resolveBestAuthorizedFrontendRoute()
    if (!targetRoute) {
      toast.add({
        title: 'Sesion iniciada sin rutas disponibles',
        description: 'Tu usuario no tiene permiso VER en ninguna pagina frontend. Pide a un administrador que te asigne accesos.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle'
      })
      await navigateTo('/login', { replace: true })
      return
    }

    await navigateTo(targetRoute, { replace: true })
  } catch (error: any) {
    console.error('Error de login:', error)

    let errorMessage = 'Credenciales inválidas'

    if (error?.message?.includes('Invalid email or password')) {
      errorMessage = 'Correo o contraseña incorrectos.'
    } else if (error?.statusCode === 403) {
      errorMessage = error?.statusMessage ?? 'No tienes permisos para la ruta de inicio.'
    }

    toast.add({
      title: '✗ Error de acceso',
      description: errorMessage,
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
            <p class="mt-1 text-xs uppercase tracking-widest text-primary dark:text-white/65">
              Portal seguro
            </p>

            <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Iniciar sesion
            </h1>
           
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
          :ui="{ label: 'text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-white/70 font-semibold' }"
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="ejemplo@correo.com"
            icon="i-lucide-mail"
            autofocus
            class="w-full"
            :ui="{ base: 'bg-white/70 text-slate-900 placeholder:text-slate-500 border border-slate-300/80 focus:border-brand-500 dark:bg-black/25 dark:text-white dark:placeholder:text-white/35 dark:border-white/20 dark:focus:border-brand-300' }"
          />
        </UFormField>

        <UFormField
          label="Contraseña"
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

        <UButton
          type="submit"
          label="Ingresar"
          block
          :loading="loading"
          size="lg"
          color="primary"
          icon="i-lucide-log-in"
          class="mt-2"
        />
      </UForm>

      <p class="mt-6 text-center text-sm text-slate-600 dark:text-white/70">
        No tienes cuenta?
        <NuxtLink to="/register" class="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Registrate
        </NuxtLink>
      </p>
  </div>
</template>
