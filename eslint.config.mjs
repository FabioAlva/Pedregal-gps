// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Si quieres que ignore carpetas conflictivas temporalmente
  ignores: ['**/dist/**', '**/.nuxt/**', '**/node_modules/**'],
  rules: {
    'vue/no-parsing-error': 'error',
  }
})