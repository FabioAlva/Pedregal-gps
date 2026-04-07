export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'indigo',
      success: 'emerald',
      info: 'sky',
      warning: 'amber',
      error: 'rose',
      neutral: 'slate',
    },
    button: {
      slots: {
        base: 'rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-300'
      }
    },
    // Configuración para Inputs
    input: {
      slots: {
        base: 'rounded-none'
      }
    },
    // Configuración para FormFields (Labels)
    formField: {
      slots: {
        label: 'text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/60 font-bold'
      }
    }
  }
  })