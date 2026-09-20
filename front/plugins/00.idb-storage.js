import { preloadIdbStorage } from '~/utils/IdbStorage.js'

// The synced lists live in IndexedDB, which only reads asynchronously, while the stores and
// list screens read them synchronously while they set up. Loading them into memory before
// the app mounts keeps that contract intact.
export default defineNuxtPlugin({
  name: 'idb-storage',
  enforce: 'pre',
  parallel: false,
  async setup() {
    await preloadIdbStorage()
  },
})
