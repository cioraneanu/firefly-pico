import { preloadIdbStorage } from '~/utils/IdbStorage.js'

export default defineNuxtPlugin({
  name: 'idb-storage',
  enforce: 'pre',
  parallel: false,
  async setup() {
    await preloadIdbStorage()
  },
})
