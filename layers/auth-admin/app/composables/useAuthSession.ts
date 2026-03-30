import { authClient } from '~~/layers/auth-admin/app/lib/auth-client'

export async function useAuthSession() {

  const toast = useToast()
  
  const isLoggingOut = ref(false)
  const isLoggingIn = ref(false)
  // Convencion de better auth para trabajar con ssr https://better-auth.com/docs/integrations/nuxt
  const { data: session, isPending, error } = await authClient.useSession(useFetch) 
  // Variable computada que espera a que la sesión este cargada 
  const user = computed(() => session.value?.user ?? null)
  // Variable computada que indica si el usuario esta autenticado o no, se basa en la existencia de la sesión
  const isAuthenticated = computed(() => Boolean(session.value))

  // Funcion para cerrar sesión 

  /*Si ya cerro sesión retorna falso , sino lo hace verdadero  y llama al metodo signOut de better auth
   si se presento un error al cerrar sesión muestra toast de error y retorna false
   Sino limpia la cache de permisos y permisos por usuario id, asi mismo limpia los localStorage 
    y muestra un toast de éxito y retorna true
  */

  const logout = async () => {
    if (isLoggingOut.value) return false
    isLoggingOut.value = true
    try {
      const result = await authClient.signOut()
      if (result?.error) {
        toast.add({
          title: 'No se pudo cerrar sesión',
          color: 'error',
          description: result.error.message ?? 'Intenta nuevamente.',
          icon: 'i-lucide-alert-circle'
        })
        return false
      }

      const permissionsState = useState('auth:my-permissions', () => null)
      permissionsState.value = null
        toast.add({
        title: 'Sesión cerrada',
        description: 'Hasta luego.',
        icon: 'i-lucide-check-circle'
      })

      /* Forzamos la salida */
      await navigateTo('/login', { replace: true })  
  
      return true
    } catch (err: any) {
      toast.add({
        title: 'Error crítico',
        description: err?.message ?? 'Fallo al cerrar sesión.',
        icon: 'i-lucide-x-circle'
      })
      return false
    } finally {
      isLoggingOut.value = false
    }
  }

  /* El que redicciona es el login.vue */
  const login = async (email:string, password:string) => {
    if (isLoggingIn.value) return false
    isLoggingIn.value = true
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result?.error) {
        toast.add({
          title: 'No se pudo iniciar sesión',
          color: 'error',
          description: result.error.message ?? 'Intenta nuevamente.',
          icon: 'i-lucide-alert-circle'
        })
        return false
      }
      toast.add({
        title: 'Sesión iniciada',
        description: 'Bienvenido.',
        icon: 'i-lucide-check-circle'
      })
      return true
  }catch(err:any){
    toast.add({
      title: 'Error crítico',
      description: err?.message ?? 'Fallo al iniciar sesión.',
      icon: 'i-lucide-x-circle'
    })
    return false
  }
}
  


  return {
    session,
    user,
    isPending,
    error,
    isAuthenticated,
    isLoggingOut,
    logout,
    isLoggingIn,
    login
  }
}
