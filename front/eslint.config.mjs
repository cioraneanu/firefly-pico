// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // rules: {
  //   'no-console': 'off', // allow console.log in TypeScript files
  // },
}).append({
  files: ['mobile/pages/**', 'desktop/pages/**'],
  rules: { 'vue/multi-word-component-names': 'off' },
})
