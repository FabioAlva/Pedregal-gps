import { authClient } from '~/lib/auth-client'

export async function useAuthSession() {
  const toast = useToast()
  const isLoggingOut = ref(false)

  const { data: session, isPending, error } = await authClient.useSession(useFetch)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => Boolean(session.value))

  const logout = async () => {
    if (isLoggingOut.value) return false

    isLoggingOut.value = true
    try {
      const result = await authClient.signOut()

      if (result?.error) {
        toast.add({
          title: 'No se pudo cerrar sesion',
          description: result.error.message ?? 'Intenta nuevamente.',
          color: 'error',
          icon: 'i-heroicons-exclamation-circle'
        })
        return false
      }

      toast.add({
        title: 'Sesion cerrada',
        description: 'Hasta luego.',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })

      const permissionsState = useState('auth:my-permissions', () => null)
      const permissionsUserIdState = useState<string | null>('auth:permissions-user-id', () => null)
      permissionsState.value = null
      permissionsUserIdState.value = null

      await navigateTo('/login', { replace: true })
      return true
    } catch (err: any) {
      toast.add({
        title: 'No se pudo cerrar sesion',
        description: err?.message ?? 'Intenta nuevamente.',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle'
      })
      return false
    } finally {
      isLoggingOut.value = false
    }
  }

  return {
    session,
    user,
    isPending,
    error,
    isAuthenticated,
    isLoggingOut,
    logout
  }
}
